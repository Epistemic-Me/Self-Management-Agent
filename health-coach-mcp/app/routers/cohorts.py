"""
Cohort management endpoints
"""
from fastapi import APIRouter, Depends
from typing import List, Dict

from app.core.hierarchy import Cohort, CONSTRAINT_HIERARCHY
from app.core.auth import verify_api_key

router = APIRouter()


@router.get("/", response_model=List[Dict])
async def list_cohorts(_: str = Depends(verify_api_key)):
    """List all available user cohorts"""
    cohorts = []
    
    for cohort, data in CONSTRAINT_HIERARCHY["cohorts"].items():
        cohorts.append({
            "id": cohort.value,
            "name": cohort.value.replace("_", " ").title(),
            "description": data["description"],
            "complexity_level": data["complexity_level"],
            "allowed_intents": [intent.value for intent in data["allowed_intents"]],
            "constraints": [c.dict() for c in data.get("constraints", [])]
        })
    
    return cohorts


@router.get("/{cohort_id}")
async def get_cohort(
    cohort_id: str,
    _: str = Depends(verify_api_key)
):
    """Get specific cohort details"""
    try:
        cohort = Cohort(cohort_id)
        data = CONSTRAINT_HIERARCHY["cohorts"][cohort]
        
        return {
            "id": cohort.value,
            "name": cohort.value.replace("_", " ").title(),
            "description": data["description"],
            "complexity_level": data["complexity_level"],
            "allowed_intents": [intent.value for intent in data["allowed_intents"]],
            "constraints": [c.dict() for c in data.get("constraints", [])]
        }
        
    except ValueError:
        return {"error": "Cohort not found"}