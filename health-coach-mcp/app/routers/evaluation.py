"""
Evaluation endpoints for constraint validation
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Optional
import asyncio
import json
from datetime import datetime

from app.models.chat import EvaluationRequest, EvaluationResult
from app.services.storage import ConversationStorage
from app.core.auth import verify_api_key
from app.core.hierarchy import CONSTRAINT_HIERARCHY, Cohort, IntentClass, Category
from app.evaluation.test_suite import HealthCoachTestSuite
from app.evaluation.synthetic_data import SyntheticDataGenerator
from app.tools.registry import tool_registry

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


@router.get("/hierarchy")
async def get_evaluation_hierarchy(_: str = Depends(verify_api_key)):
    """Get the complete evaluation hierarchy for the Agent Evaluation dashboard"""
    
    # Build the hierarchy structure for the UI
    hierarchy_nodes = []
    
    # Root node
    hierarchy_nodes.append({
        "id": "health_coach_agent",
        "name": "Health Coach Agent",
        "type": "root",
        "description": "AI Health Coach with hierarchical constraint system",
        "children": ["cohorts"],
        "metadata": {
            "total_sub_intents": len(CONSTRAINT_HIERARCHY["sub_intents"]),
            "total_cohorts": len(list(Cohort)),
            "total_categories": len(list(Category)),
            "total_intents": len(list(IntentClass))
        }
    })
    
    # Cohorts level
    hierarchy_nodes.append({
        "id": "cohorts",
        "name": "User Cohorts",
        "type": "cohort_level",
        "description": "User classification based on health/fitness level",
        "children": [cohort.value for cohort in Cohort],
        "metadata": {"level": 1}
    })
    
    # Individual cohorts
    for cohort in Cohort:
        cohort_data = CONSTRAINT_HIERARCHY["cohorts"][cohort]
        hierarchy_nodes.append({
            "id": cohort.value,
            "name": cohort.value.replace("_", " ").title(),
            "type": "cohort",
            "description": cohort_data["description"],
            "children": [f"{cohort.value}_intents"],
            "metadata": {
                "level": 2,
                "allowed_intents": [intent.value for intent in cohort_data["allowed_intents"]],
                "complexity_level": cohort_data["complexity_level"],
                "constraint_count": len(cohort_data.get("constraints", []))
            }
        })
        
        # Intent level for each cohort
        hierarchy_nodes.append({
            "id": f"{cohort.value}_intents",
            "name": "Intent Classes",
            "type": "intent_level",
            "description": "Types of user interactions",
            "children": [f"{cohort.value}_{intent.value}" for intent in cohort_data["allowed_intents"]],
            "metadata": {"level": 3, "cohort": cohort.value}
        })
        
        # Individual intents for each cohort
        for intent in cohort_data["allowed_intents"]:
            hierarchy_nodes.append({
                "id": f"{cohort.value}_{intent.value}",
                "name": intent.value.replace("_", " ").title(),
                "type": "intent",
                "description": _get_intent_description(intent),
                "children": [f"{cohort.value}_{intent.value}_categories"],
                "metadata": {
                    "level": 4,
                    "cohort": cohort.value,
                    "intent": intent.value
                }
            })
            
            # Categories level
            hierarchy_nodes.append({
                "id": f"{cohort.value}_{intent.value}_categories",
                "name": "Health Categories",
                "type": "category_level",
                "description": "Health domains (Sleep, Nutrition, Exercise)",
                "children": [f"{cohort.value}_{intent.value}_{cat.value}" for cat in Category],
                "metadata": {"level": 5, "cohort": cohort.value, "intent": intent.value}
            })
            
            # Individual categories
            for category in Category:
                # Find sub-intents for this combination
                matching_sub_intents = [
                    sub_intent_id for sub_intent_id, sub_intent in CONSTRAINT_HIERARCHY["sub_intents"].items()
                    if sub_intent.parent_category == category and sub_intent.parent_intent == intent
                ]
                
                hierarchy_nodes.append({
                    "id": f"{cohort.value}_{intent.value}_{category.value}",
                    "name": category.value.title(),
                    "type": "category",
                    "description": _get_category_description(category),
                    "children": [f"{cohort.value}_{intent.value}_{category.value}_sub_intents"] if matching_sub_intents else [],
                    "metadata": {
                        "level": 6,
                        "cohort": cohort.value,
                        "intent": intent.value,
                        "category": category.value,
                        "sub_intent_count": len(matching_sub_intents)
                    }
                })
                
                # Sub-intents level
                if matching_sub_intents:
                    hierarchy_nodes.append({
                        "id": f"{cohort.value}_{intent.value}_{category.value}_sub_intents",
                        "name": "Sub-Intents",
                        "type": "sub_intent_level",
                        "description": "Specific implementation patterns",
                        "children": [f"{cohort.value}_{intent.value}_{category.value}_{si}" for si in matching_sub_intents],
                        "metadata": {"level": 7, "cohort": cohort.value, "intent": intent.value, "category": category.value}
                    })
                    
                    # Individual sub-intents
                    for sub_intent_id in matching_sub_intents:
                        sub_intent = CONSTRAINT_HIERARCHY["sub_intents"][sub_intent_id]
                        hierarchy_nodes.append({
                            "id": f"{cohort.value}_{intent.value}_{category.value}_{sub_intent_id}",
                            "name": sub_intent.name,
                            "type": "sub_intent",
                            "description": sub_intent.description,
                            "children": [],
                            "metadata": {
                                "level": 8,
                                "cohort": cohort.value,
                                "intent": intent.value,
                                "category": category.value,
                                "sub_intent_id": sub_intent_id,
                                "constraint_count": len(sub_intent.constraints),
                                "example_queries": sub_intent.example_queries[:2],  # Limit for UI
                                "constraints": [{
                                    "id": c.id,
                                    "type": c.type.value,
                                    "description": c.description,
                                    "severity": c.severity
                                } for c in sub_intent.constraints]
                            }
                        })
    
    return {
        "hierarchy": hierarchy_nodes,
        "stats": {
            "total_nodes": len(hierarchy_nodes),
            "max_depth": 8,
            "cohort_count": len(list(Cohort)),
            "intent_count": len(list(IntentClass)),
            "category_count": len(list(Category)),
            "sub_intent_count": len(CONSTRAINT_HIERARCHY["sub_intents"]),
            "constraint_count": sum(len(si.constraints) for si in CONSTRAINT_HIERARCHY["sub_intents"].values())
        },
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "version": "2.0",
            "description": "Hierarchical constraint system for AI Health Coach evaluation"
        }
    }


@router.get("/tools")
async def get_available_tools(_: str = Depends(verify_api_key)):
    """Get available MCP tools for evaluation"""
    tool_definitions = tool_registry.get_tool_definitions()
    
    tools_by_type = {}
    for name, definition in tool_definitions.items():
        tool_type = definition.type.value
        if tool_type not in tools_by_type:
            tools_by_type[tool_type] = []
        
        tools_by_type[tool_type].append({
            "name": name,
            "description": definition.description,
            "parameters": [{
                "name": p.name,
                "type": p.type,
                "description": p.description,
                "required": p.required
            } for p in definition.parameters],
            "applicable_cohorts": [c.value for c in definition.applicable_cohorts],
            "applicable_intents": [i.value for i in definition.applicable_intents],
            "applicable_categories": [cat.value for cat in definition.applicable_categories],
            "safety_checks": definition.safety_checks
        })
    
    return {
        "tools_by_type": tools_by_type,
        "total_tools": len(tool_definitions),
        "tool_types": list(tools_by_type.keys())
    }


@router.post("/run_synthetic_evaluation")
async def run_synthetic_evaluation(
    query_count: int = 50,
    user_count: int = 10,
    _: str = Depends(verify_api_key)
):
    """Run synthetic evaluation suite"""
    try:
        test_suite = HealthCoachTestSuite()
        
        # Generate test data
        data_generator = SyntheticDataGenerator(seed=42)
        test_users = data_generator.generate_users(user_count)
        test_queries = data_generator.generate_queries(query_count)
        
        # Run evaluation (simplified for demonstration)
        results = {
            "test_data_generated": {
                "users": len(test_users),
                "queries": len(test_queries),
                "query_distribution": _analyze_query_distribution(test_queries)
            },
            "sample_users": [
                {
                    "user_id": user.user_id,
                    "cohort": user.cohort.value,
                    "demographics": user.demographics,
                    "health_goals": user.health_goals[:2]  # Limit for response size
                }
                for user in test_users[:3]
            ],
            "sample_queries": [
                {
                    "query_id": query.query_id,
                    "text": query.text,
                    "expected_category": query.expected_category.value if query.expected_category else None,
                    "expected_intent": query.expected_intent.value if query.expected_intent else None,
                    "user_cohort": query.user_cohort.value,
                    "query_type": query.query_type,
                    "difficulty_level": query.difficulty_level
                }
                for query in test_queries[:5]
            ],
            "evaluation_ready": True,
            "timestamp": datetime.now().isoformat()
        }
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


@router.get("/constraint_analysis")
async def get_constraint_analysis(_: str = Depends(verify_api_key)):
    """Analyze constraints across the hierarchy"""
    constraint_stats = {
        "by_type": {},
        "by_severity": {},
        "by_sub_intent": {},
        "total_constraints": 0
    }
    
    # Analyze constraints from sub-intents
    for sub_intent_id, sub_intent in CONSTRAINT_HIERARCHY["sub_intents"].items():
        constraint_stats["by_sub_intent"][sub_intent_id] = {
            "name": sub_intent.name,
            "constraint_count": len(sub_intent.constraints),
            "constraints": []
        }
        
        for constraint in sub_intent.constraints:
            constraint_stats["total_constraints"] += 1
            
            # Count by type
            constraint_type = constraint.type.value
            if constraint_type not in constraint_stats["by_type"]:
                constraint_stats["by_type"][constraint_type] = 0
            constraint_stats["by_type"][constraint_type] += 1
            
            # Count by severity
            severity = constraint.severity
            if severity not in constraint_stats["by_severity"]:
                constraint_stats["by_severity"][severity] = 0
            constraint_stats["by_severity"][severity] += 1
            
            # Add to sub-intent analysis
            constraint_stats["by_sub_intent"][sub_intent_id]["constraints"].append({
                "id": constraint.id,
                "type": constraint_type,
                "description": constraint.description,
                "severity": severity
            })
    
    # Add cohort-level constraints
    for cohort, cohort_data in CONSTRAINT_HIERARCHY["cohorts"].items():
        for constraint in cohort_data.get("constraints", []):
            constraint_stats["total_constraints"] += 1
            
            constraint_type = constraint.type.value
            if constraint_type not in constraint_stats["by_type"]:
                constraint_stats["by_type"][constraint_type] = 0
            constraint_stats["by_type"][constraint_type] += 1
            
            severity = constraint.severity
            if severity not in constraint_stats["by_severity"]:
                constraint_stats["by_severity"][severity] = 0
            constraint_stats["by_severity"][severity] += 1
    
    return constraint_stats


def _get_intent_description(intent: IntentClass) -> str:
    """Get description for intent class"""
    descriptions = {
        IntentClass.PLAN: "Creating plans, goals, or structured approaches",
        IntentClass.TASK: "Automating tasks, setting reminders, tracking",
        IntentClass.OPINION_RESEARCH: "Gathering opinions, comparing philosophies",
        IntentClass.EVIDENCE_RESEARCH: "Scientific research, studies, evidence"
    }
    return descriptions.get(intent, "")


def _get_category_description(category: Category) -> str:
    """Get description for category"""
    descriptions = {
        Category.SLEEP: "Sleep patterns, quality, recovery, and optimization",
        Category.NUTRITION: "Diet, meal planning, supplements, and nutrition",
        Category.EXERCISE: "Physical activity, training, and movement"
    }
    return descriptions.get(category, "")


def _analyze_query_distribution(queries) -> Dict[str, int]:
    """Analyze distribution of query types"""
    distribution = {}
    for query in queries:
        query_type = query.query_type
        if query_type not in distribution:
            distribution[query_type] = 0
        distribution[query_type] += 1
    return distribution