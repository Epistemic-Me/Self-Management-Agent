"""
Chat endpoint with hierarchical routing and provenance
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging
from uuid import uuid4

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