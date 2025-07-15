"""
Component testing endpoints for the Health Coach Agent
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Optional, Any
from datetime import datetime
from pydantic import BaseModel
import asyncio
import time

from app.core.auth import verify_api_key
from app.core.hierarchy import CONSTRAINT_HIERARCHY, Cohort, IntentClass, Category
from app.services.router import SemanticRouter
from app.services.retrievers import ProfileRetriever, BeliefRetriever, HealthDataRetriever, MemoryRetriever
from app.services.coach import HealthCoach

router = APIRouter()


class ComponentTestRequest(BaseModel):
    query: str
    nodeId: str
    userId: Optional[str] = "test_user"
    context: Optional[Dict[str, Any]] = None


class RouterTestResult(BaseModel):
    success: bool
    routing_decision: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None
    reasoning: Optional[str] = None
    execution_time: float
    error: Optional[str] = None


class RetrieverTestResult(BaseModel):
    success: bool
    retrieved_data: Optional[Dict[str, Any]] = None
    data_sources: Optional[List[str]] = None
    execution_time: float
    error: Optional[str] = None


class ToolTestResult(BaseModel):
    success: bool
    response: Optional[str] = None
    constraints: Optional[List[Dict[str, Any]]] = None
    constraint_violations: Optional[List[str]] = None
    execution_time: float
    error: Optional[str] = None


class EndToEndTestResult(BaseModel):
    success: bool
    response: Optional[str] = None
    pipeline: Optional[List[Dict[str, Any]]] = None
    execution_time: float
    error: Optional[str] = None


@router.post("/test-router", response_model=RouterTestResult)
async def test_router_component(
    request: ComponentTestRequest,
    _: str = Depends(verify_api_key)
) -> RouterTestResult:
    """Test the semantic router component for a specific sub-intent"""
    start_time = time.time()
    
    try:
        # For now, return a mock successful routing result to test the UI
        # In production, this would use the actual semantic router
        
        # Parse the expected sub-intent from nodeId
        node_parts = request.nodeId.split('_')
        expected_category = None
        expected_intent = None
        expected_sub_intent_id = request.nodeId
        
        if len(node_parts) >= 3:
            # Format: cohort_intent_category_sub_intent_id
            if len(node_parts) >= 4:
                expected_category = node_parts[2]
                expected_intent = node_parts[1] 
                expected_sub_intent_id = '_'.join(node_parts[3:])
            else:
                expected_sub_intent_id = '_'.join(node_parts)
        
        # Mock routing decision
        routing_decision = {
            "category": expected_category or "exercise",
            "intent": expected_intent or "evidence_research", 
            "sub_intent_id": expected_sub_intent_id,
            "confidence": 0.85,
            "reasoning": f"Query '{request.query}' matched patterns for {expected_sub_intent_id}",
            "expected_match": True,
            "expected": expected_sub_intent_id,
            "actual": expected_sub_intent_id,
            "mock_test": True
        }
        
        execution_time = time.time() - start_time
        
        return RouterTestResult(
            success=True,
            routing_decision=routing_decision,
            confidence=0.85,
            reasoning=routing_decision["reasoning"],
            execution_time=execution_time
        )
        
    except Exception as e:
        execution_time = time.time() - start_time
        return RouterTestResult(
            success=False,
            execution_time=execution_time,
            error=str(e)
        )


@router.post("/test-retriever", response_model=RetrieverTestResult)
async def test_retriever_component(
    request: ComponentTestRequest,
    _: str = Depends(verify_api_key)
) -> RetrieverTestResult:
    """Test the retriever components for a specific sub-intent"""
    start_time = time.time()
    
    try:
        # Mock retriever test for now - in production this would call actual retrievers
        sub_intent = _get_sub_intent_from_node_id(request.nodeId)
        
        # Mock retrieved data based on sub-intent type
        retrieved_data = {
            "profile": {
                "user_id": request.userId,
                "age": 32,
                "fitness_level": "intermediate",
                "goals": ["muscle_gain", "performance"],
                "preferences": {"workout_time": "morning", "equipment": "gym"}
            },
            "beliefs": [
                {"content": "Progressive overload is key for muscle growth", "confidence": 0.9},
                {"content": "Rest days are as important as training days", "confidence": 0.8},
                {"content": "Nutrition timing matters for performance", "confidence": 0.7}
            ],
            "health_data": {
                "recent_workouts": 4,
                "avg_sleep": 7.2,
                "steps_per_day": 8500,
                "heart_rate_variability": 42
            },
            "memory": [
                {"timestamp": "2024-01-15", "query": "Best rep ranges for hypertrophy"},
                {"timestamp": "2024-01-14", "query": "How often should I train chest"},
                {"timestamp": "2024-01-13", "query": "Deload week protocols"}
            ]
        }
        
        data_sources = ["profile", "beliefs", "health_data", "memory"]
        
        # Add sub-intent specific context
        if sub_intent:
            retrieved_data["sub_intent_context"] = {
                "name": sub_intent.name,
                "category": sub_intent.parent_category.value,
                "intent": sub_intent.parent_intent.value,
                "constraints_count": len(sub_intent.constraints)
            }
            data_sources.append("sub_intent_context")
        
        execution_time = time.time() - start_time
        
        return RetrieverTestResult(
            success=True,
            retrieved_data=retrieved_data,
            data_sources=data_sources,
            execution_time=execution_time
        )
        
    except Exception as e:
        execution_time = time.time() - start_time
        return RetrieverTestResult(
            success=False,
            execution_time=execution_time,
            error=str(e)
        )


@router.post("/test-tool", response_model=ToolTestResult)
async def test_tool_component(
    request: ComponentTestRequest,
    _: str = Depends(verify_api_key)
) -> ToolTestResult:
    """Test the tool/response generation component for a specific sub-intent"""
    start_time = time.time()
    
    try:
        # Get the sub-intent definition
        sub_intent = _get_sub_intent_from_node_id(request.nodeId)
        if not sub_intent:
            # Mock response for unknown sub-intents
            mock_response = f"Based on your query '{request.query}', here's what I can tell you about health and fitness. This is a mock response to test the component testing interface."
            execution_time = time.time() - start_time
            
            return ToolTestResult(
                success=True,
                response=mock_response,
                constraints=[],
                constraint_violations=None,
                execution_time=execution_time
            )
        
        # Mock response based on sub-intent
        if "meta_analysis" in request.nodeId:
            mock_response = """Based on recent meta-analyses, training frequency recommendations vary by muscle group and individual factors. Studies suggest 2-3 sessions per muscle group per week optimize hypertrophy when volume is equated. A 2020 meta-analysis by Schoenfeld et al. found superior gains with higher frequencies when weekly volume exceeded 10 sets per muscle group."""
        elif "rcts" in request.nodeId:
            mock_response = """Recent RCTs examining training frequency show mixed results. One notable study (Brigatto et al., 2019) compared 1x vs 2x weekly training and found superior hypertrophy with twice-weekly training. However, individual response varies significantly based on recovery capacity and training status."""
        else:
            mock_response = f"Mock response for sub-intent: {sub_intent.name}. This demonstrates the tool component generating responses based on specific constraints and retrieved context."
        
        # Mock constraint compliance checking
        constraint_results = []
        violations = []
        
        for constraint in sub_intent.constraints:
            # Mock constraint checking
            passed = True
            violation_reason = None
            
            # Simple mock validation
            if constraint.type.value == "data_source" and "peer-reviewed" in constraint.description.lower():
                passed = "meta-analysis" in mock_response.lower() or "study" in mock_response.lower()
                if not passed:
                    violation_reason = "Response doesn't cite appropriate research sources"
            
            constraint_results.append({
                "id": constraint.id,
                "name": constraint.description,
                "type": constraint.type.value,
                "passed": passed,
                "violation_reason": violation_reason
            })
            
            if not passed:
                violations.append(f"{constraint.id}: {violation_reason}")
        
        execution_time = time.time() - start_time
        
        return ToolTestResult(
            success=True,
            response=mock_response,
            constraints=constraint_results,
            constraint_violations=violations if violations else None,
            execution_time=execution_time
        )
        
    except Exception as e:
        execution_time = time.time() - start_time
        return ToolTestResult(
            success=False,
            execution_time=execution_time,
            error=str(e)
        )


@router.post("/test-component", response_model=EndToEndTestResult)
async def test_component_end_to_end(
    request: ComponentTestRequest,
    _: str = Depends(verify_api_key)
) -> EndToEndTestResult:
    """Test the complete component pipeline: Router → Retriever → Tool"""
    start_time = time.time()
    
    try:
        pipeline_results = []
        
        # Step 1: Router (Mock)
        router_start = time.time()
        
        # Mock routing decision
        routing_decision = {
            "category": "exercise",
            "intent": "evidence_research",
            "sub_intent_id": request.nodeId,
            "confidence": 0.85
        }
        
        router_time = time.time() - router_start
        
        pipeline_results.append({
            "component": "router",
            "success": True,
            "executionTime": round(router_time * 1000) + 145,  # Add mock latency
            "result": routing_decision
        })
        
        # Step 2: Retriever (Mock)
        retriever_start = time.time()
        
        # Mock context data
        context = {
            "profile": {"age": 32, "fitness_level": "intermediate"},
            "beliefs": ["Progressive overload is key", "Rest days are important"],
            "health_data": {"recent_workouts": 4, "avg_sleep": 7.2},
            "memory": ["Previous query about training frequency"]
        }
        
        retriever_time = time.time() - retriever_start
        
        pipeline_results.append({
            "component": "retriever",
            "success": True,
            "executionTime": round(retriever_time * 1000) + 230,  # Add mock latency
            "result": {"data_sources": list(context.keys()), "context_size": len(str(context))}
        })
        
        # Step 3: Tool (Mock Response Generation)
        tool_start = time.time()
        
        # Mock response based on query and sub-intent
        if "meta_analysis" in request.nodeId:
            response = """Based on recent meta-analyses, training frequency recommendations vary by muscle group and individual factors. Studies suggest 2-3 sessions per muscle group per week optimize hypertrophy when volume is equated. A 2020 meta-analysis by Schoenfeld et al. found superior gains with higher frequencies when weekly volume exceeded 10 sets per muscle group."""
        else:
            response = f"Mock end-to-end response for query: '{request.query}'. This demonstrates the complete pipeline from routing through retrieval to response generation with constraint validation."
        
        tool_time = time.time() - tool_start
        
        pipeline_results.append({
            "component": "tool",
            "success": True,
            "executionTime": round(tool_time * 1000) + 1850,  # Add mock latency
            "result": {"response_length": len(response), "constraints_applied": 3}
        })
        
        total_time = time.time() - start_time
        
        return EndToEndTestResult(
            success=True,
            response=response,
            pipeline=pipeline_results,
            execution_time=total_time
        )
        
    except Exception as e:
        execution_time = time.time() - start_time
        return EndToEndTestResult(
            success=False,
            execution_time=execution_time,
            error=str(e)
        )


def _get_sub_intent_from_node_id(node_id: str):
    """Get sub-intent definition from node ID"""
    # Extract sub-intent ID from the node ID
    # Node IDs are in format: cohort_intent_category_sub_intent_id
    parts = node_id.split('_')
    if len(parts) >= 4:
        sub_intent_id = '_'.join(parts[3:])  # Handle multi-word sub-intent IDs
        return CONSTRAINT_HIERARCHY["sub_intents"].get(sub_intent_id)
    
    # Direct lookup if not hierarchical format
    return CONSTRAINT_HIERARCHY["sub_intents"].get(node_id)


@router.get("/sub-intents")
async def get_sub_intents(_: str = Depends(verify_api_key)):
    """Get all available sub-intents for testing"""
    sub_intents = []
    
    for sub_intent_id, sub_intent in CONSTRAINT_HIERARCHY["sub_intents"].items():
        sub_intents.append({
            "id": sub_intent_id,
            "name": sub_intent.name,
            "description": sub_intent.description,
            "category": sub_intent.parent_category.value,
            "intent": sub_intent.parent_intent.value,
            "constraints_count": len(sub_intent.constraints),
            "example_queries": sub_intent.example_queries
        })
    
    return {"sub_intents": sub_intents}


@router.get("/component-metrics")
async def get_component_metrics(_: str = Depends(verify_api_key)):
    """Get aggregated metrics for all components"""
    # This would typically come from a metrics store/database
    # For now, return mock data
    
    return {
        "router_metrics": {
            "total_queries": 1250,
            "accuracy": 0.87,
            "avg_confidence": 0.82,
            "avg_latency_ms": 145
        },
        "retriever_metrics": {
            "total_retrievals": 1250,
            "success_rate": 0.94,
            "avg_latency_ms": 230,
            "cache_hit_rate": 0.68
        },
        "tool_metrics": {
            "total_generations": 1250,
            "constraint_compliance": 0.91,
            "avg_latency_ms": 1850,
            "user_satisfaction": 0.86
        }
    }