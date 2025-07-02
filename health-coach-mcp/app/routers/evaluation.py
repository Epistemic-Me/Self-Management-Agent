"""
Evaluation endpoints for constraint validation
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List

from app.models.chat import EvaluationRequest, EvaluationResult
from app.services.storage import ConversationStorage
from app.core.auth import verify_api_key

router = APIRouter()


@router.post("/", response_model=EvaluationResult)
async def evaluate_response(
    request: EvaluationRequest,
    _: str = Depends(verify_api_key)
) -> EvaluationResult:
    """Evaluate a response against its constraints"""
    violations = []
    score = 1.0
    suggestions = []
    
    # Check each constraint
    for constraint in request.routing_decision.constraints:
        violation = await _check_constraint(
            constraint,
            request.response,
            request.original_query
        )
        
        if violation:
            violations.append(violation)
            # Reduce score based on severity
            severity_weights = {"high": 0.3, "medium": 0.2, "low": 0.1}
            score -= severity_weights.get(constraint.severity, 0.1)
    
    # Ensure score doesn't go below 0
    score = max(0.0, score)
    
    # Generate suggestions based on violations
    if violations:
        suggestions = _generate_suggestions(violations)
    
    return EvaluationResult(
        passed=len(violations) == 0,
        violations=violations,
        suggestions=suggestions,
        score=score
    )


@router.get("/traces")
async def get_evaluation_traces(
    user_id: str = None,
    limit: int = 50,
    _: str = Depends(verify_api_key)
):
    """Get conversation traces for evaluation"""
    storage = ConversationStorage()
    traces = await storage.get_traces_for_evaluation(user_id, limit)
    return traces


@router.get("/traces/{trace_id}")
async def get_trace_for_evaluation(
    trace_id: str,
    _: str = Depends(verify_api_key)
):
    """Get specific trace for evaluation"""
    storage = ConversationStorage()
    
    # Try to get from evaluation cache
    try:
        import redis.asyncio as redis
        r = redis.from_url("redis://redis:6379/3")  # TODO: Use config
        data = await r.get(f"evaluation:{trace_id}")
        
        if data:
            import json
            return json.loads(data)
        else:
            raise HTTPException(status_code=404, detail="Trace not found")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _check_constraint(constraint, response: str, query: str) -> Dict:
    """Check if a response violates a constraint"""
    # Simple constraint checking - in production, this would be more sophisticated
    
    if constraint.type.value == "data_source":
        if "peer-reviewed" in constraint.description.lower():
            if not any(term in response.lower() for term in ["study", "research", "meta-analysis"]):
                return {
                    "constraint_id": constraint.id,
                    "type": constraint.type.value,
                    "description": constraint.description,
                    "violation": "Response doesn't cite appropriate research sources",
                    "severity": constraint.severity
                }
    
    elif constraint.type.value == "scope_boundary":
        if "no anecdotes" in constraint.description.lower():
            if any(term in response.lower() for term in ["i know someone", "my friend", "personally"]):
                return {
                    "constraint_id": constraint.id,
                    "type": constraint.type.value,
                    "description": constraint.description,
                    "violation": "Response includes anecdotal evidence",
                    "severity": constraint.severity
                }
    
    elif constraint.type.value == "tone":
        if "simple" in constraint.description.lower():
            # Simple check for jargon
            jargon_terms = ["bioavailability", "thermogenesis", "gluconeogenesis"]
            if any(term in response.lower() for term in jargon_terms):
                return {
                    "constraint_id": constraint.id,
                    "type": constraint.type.value,
                    "description": constraint.description,
                    "violation": "Response uses technical jargon",
                    "severity": constraint.severity
                }
    
    return None


def _generate_suggestions(violations: List[Dict]) -> List[str]:
    """Generate improvement suggestions based on violations"""
    suggestions = []
    
    for violation in violations:
        if violation["type"] == "data_source":
            suggestions.append("Include citations to peer-reviewed research")
        elif violation["type"] == "scope_boundary":
            suggestions.append("Remove anecdotal examples and focus on evidence")
        elif violation["type"] == "tone":
            suggestions.append("Simplify language and explain technical terms")
    
    return suggestions