"""
Intent hierarchy endpoints
"""
from fastapi import APIRouter, Depends
from typing import List, Dict

from app.core.hierarchy import (
    IntentClass, Category, CONSTRAINT_HIERARCHY
)
from app.core.auth import verify_api_key

router = APIRouter()


@router.get("/", response_model=Dict)
async def get_intent_hierarchy(_: str = Depends(verify_api_key)):
    """Get the full intent hierarchy"""
    hierarchy = {
        "intent_classes": {
            intent.value: {
                "id": intent.value,
                "name": intent.value.replace("_", " ").title(),
                "description": _get_intent_description(intent)
            }
            for intent in IntentClass
        },
        "categories": {
            category.value: {
                "id": category.value,
                "name": category.value.title(),
                "description": _get_category_description(category)
            }
            for category in Category
        },
        "sub_intents": {}
    }
    
    # Add sub-intents
    for sub_intent_id, sub_intent in CONSTRAINT_HIERARCHY["sub_intents"].items():
        hierarchy["sub_intents"][sub_intent_id] = {
            "id": sub_intent.id,
            "name": sub_intent.name,
            "description": sub_intent.description,
            "parent_category": sub_intent.parent_category.value,
            "parent_intent": sub_intent.parent_intent.value,
            "constraints": [c.dict() for c in sub_intent.constraints],
            "example_queries": sub_intent.example_queries,
            "excluded_patterns": sub_intent.excluded_patterns
        }
    
    return hierarchy


@router.get("/categories/{category}")
async def get_category_sub_intents(
    category: str,
    _: str = Depends(verify_api_key)
):
    """Get sub-intents for a specific category"""
    try:
        cat_enum = Category(category)
        sub_intents = []
        
        for sub_intent_id, sub_intent in CONSTRAINT_HIERARCHY["sub_intents"].items():
            if sub_intent.parent_category == cat_enum:
                sub_intents.append({
                    "id": sub_intent.id,
                    "name": sub_intent.name,
                    "description": sub_intent.description,
                    "parent_intent": sub_intent.parent_intent.value,
                    "example_queries": sub_intent.example_queries[:3]  # Limit examples
                })
        
        return {
            "category": category,
            "sub_intents": sub_intents
        }
        
    except ValueError:
        return {"error": "Category not found"}


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