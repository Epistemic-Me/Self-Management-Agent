"""
Chat endpoint with hierarchical routing and provenance
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import Optional, AsyncGenerator
import logging
import json
import asyncio
from uuid import uuid4
from datetime import datetime

from app.models.chat import (
    ChatRequest, ChatResponse, ChatMessage,
    ConversationTrace, Provenance
)
from app.services.router import SemanticRouter
from app.services.coach import HealthCoach
from app.services.storage import ConversationStorage
from app.core.auth import verify_api_key

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    _: str = Depends(verify_api_key)
) -> ChatResponse:
    """
    Main chat endpoint with hierarchical routing and provenance tracking
    """
    try:
        # Initialize services
        semantic_router = SemanticRouter()
        health_coach = HealthCoach()
        storage = ConversationStorage()
        
        # Generate trace ID
        trace_id = str(uuid4())
        
        # Load or create conversation trace
        trace = await storage.get_or_create_trace(
            session_id=request.session_id,
            user_id=request.user_id
        )
        
        # Add user message to trace
        user_message = ChatMessage(
            role="user",
            content=request.message,
            metadata={"cohort": request.cohort.value}
        )
        trace.messages.append(user_message)
        
        # Route the query
        routing_decision = await semantic_router.route(
            query=request.message,
            user_cohort=request.cohort,
            context=request.context
        )
        trace.routing_decisions.append(routing_decision)
        
        # Generate response with constraints
        response_content = await health_coach.generate_response(
            query=request.message,
            routing_decision=routing_decision,
            user_cohort=request.cohort,
            context=request.context
        )
        
        # Create provenance if requested
        provenance = None
        if request.include_provenance:
            provenance = semantic_router.create_provenance(
                routing_decision=routing_decision,
                user_cohort=request.cohort,
                trace_id=trace_id
            )
            trace.provenances.append(provenance)
        
        # Add assistant message to trace
        assistant_message = ChatMessage(
            role="assistant",
            content=response_content,
            metadata={
                "provenance": provenance.dict() if provenance else None,
                "routing": routing_decision.dict()
            }
        )
        trace.messages.append(assistant_message)
        
        # Save trace
        await storage.save_trace(trace)
        
        # Log for monitoring
        logger.info(
            f"Chat request processed - "
            f"User: {request.user_id}, "
            f"Session: {request.session_id}, "
            f"Route: {routing_decision.category.value} > "
            f"{routing_decision.intent_class.value} > "
            f"{routing_decision.sub_intent_id or 'general'}"
        )
        
        return ChatResponse(
            response=response_content,
            session_id=request.session_id,
            provenance=provenance,
            metadata={
                "trace_id": trace_id,
                "confidence": routing_decision.confidence
            }
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    _: str = Depends(verify_api_key)
):
    """
    Streaming chat endpoint with real-time provenance updates
    """
    async def generate_stream() -> AsyncGenerator[str, None]:
        try:
            # Initialize services
            semantic_router = SemanticRouter()
            health_coach = HealthCoach()
            storage = ConversationStorage()
            
            # Generate trace ID
            trace_id = str(uuid4())
            
            # Stage 1: Cohort Analysis
            yield f"data: {json.dumps({'type': 'provenance', 'stage': 'cohort_analysis', 'data': {'cohort': request.cohort.value, 'description': f'Analyzing query for {request.cohort.value} cohort'}, 'timestamp': trace_id})}\n\n"
            await asyncio.sleep(0.1)
            
            # Stage 2: Intent Classification
            yield f"data: {json.dumps({'type': 'provenance', 'stage': 'intent_classification', 'data': {'status': 'processing', 'description': 'Classifying intent and category'}, 'timestamp': trace_id})}\n\n"
            await asyncio.sleep(0.2)
            
            # Route the query
            routing_decision = await semantic_router.route(
                query=request.message,
                user_cohort=request.cohort,
                context=request.context
            )
            
            # Stage 3: Routing Decision
            yield f"data: {json.dumps({'type': 'provenance', 'stage': 'routing_decision', 'data': {'category': routing_decision.category.value, 'intent': routing_decision.intent_class.value, 'confidence': routing_decision.confidence, 'description': f'Routed to {routing_decision.category.value} > {routing_decision.intent_class.value}'}, 'timestamp': trace_id})}\n\n"
            await asyncio.sleep(0.1)
            
            # Stage 4: Constraint Application
            cohort_constraints = [c.dict() for c in routing_decision.constraints]
            yield f"data: {json.dumps({'type': 'provenance', 'stage': 'constraint_application', 'data': {'constraints': cohort_constraints, 'description': f'Applying {len(cohort_constraints)} constraints'}, 'timestamp': trace_id})}\n\n"
            await asyncio.sleep(0.1)
            
            # Stage 5: Response Generation
            yield f"data: {json.dumps({'type': 'provenance', 'stage': 'response_generation', 'data': {'status': 'generating', 'description': 'Generating personalized response with applied constraints'}, 'timestamp': trace_id})}\n\n"
            
            # Generate response with streaming (this is the slow part)
            full_response = ""
            async for chunk in health_coach.generate_response_stream(
                query=request.message,
                routing_decision=routing_decision,
                user_cohort=request.cohort,
                context=request.context
            ):
                full_response += chunk
                # Stream each chunk as it comes
                yield f"data: {json.dumps({'type': 'response_chunk', 'chunk': chunk, 'timestamp': trace_id})}\n\n"
            
            # Stage 6: Response Ready
            yield f"data: {json.dumps({'type': 'provenance', 'stage': 'response_ready', 'data': {'status': 'complete', 'description': 'Response generation complete'}, 'timestamp': trace_id})}\n\n"
            
            # Send final complete response
            yield f"data: {json.dumps({'type': 'response_complete', 'content': full_response, 'timestamp': trace_id})}\n\n"
            
            # Create final provenance
            if request.include_provenance:
                provenance = semantic_router.create_provenance(
                    routing_decision=routing_decision,
                    user_cohort=request.cohort,
                    trace_id=trace_id
                )
                # Convert provenance to dict with ISO timestamp
                provenance_dict = provenance.dict()
                if 'timestamp' in provenance_dict and isinstance(provenance_dict['timestamp'], datetime):
                    provenance_dict['timestamp'] = provenance_dict['timestamp'].isoformat()
                yield f"data: {json.dumps({'type': 'final_provenance', 'provenance': provenance_dict, 'timestamp': trace_id})}\n\n"
            
            # Save to storage (async)
            trace = await storage.get_or_create_trace(
                session_id=request.session_id,
                user_id=request.user_id
            )
            
            user_message = ChatMessage(
                role="user",
                content=request.message,
                metadata={"cohort": request.cohort.value}
            )
            trace.messages.append(user_message)
            
            assistant_message = ChatMessage(
                role="assistant", 
                content=full_response,
                metadata={
                    "routing": routing_decision.dict(),
                    "trace_id": trace_id
                }
            )
            trace.messages.append(assistant_message)
            
            await storage.save_trace(trace)
            
            # End stream
            yield f"data: {json.dumps({'type': 'complete', 'session_id': request.session_id, 'timestamp': trace_id})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming chat error: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e), 'timestamp': trace_id})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    _: str = Depends(verify_api_key)
) -> ConversationTrace:
    """Get full conversation trace for a session"""
    storage = ConversationStorage()
    trace = await storage.get_trace(session_id)
    
    if not trace:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return trace


@router.get("/session/{session_id}/evaluation")
async def get_session_for_evaluation(
    session_id: str,
    _: str = Depends(verify_api_key)
):
    """Get session data formatted for open coding evaluation"""
    storage = ConversationStorage()
    trace = await storage.get_trace(session_id)
    
    if not trace:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return trace.to_evaluation_format()