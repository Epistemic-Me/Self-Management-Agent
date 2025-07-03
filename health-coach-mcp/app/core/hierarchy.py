"""
Hierarchical constraint system definitions
"""
from enum import Enum
from typing import Dict, List, Optional, Set
from pydantic import BaseModel


class Cohort(str, Enum):
    """User cohort classifications"""
    SEDENTARY_BEGINNER = "sedentary_beginner"
    HEALTH_ENTHUSIAST = "health_enthusiast"
    OPTIMIZER = "optimizer"
    BIOHACKER = "biohacker"


class IntentClass(str, Enum):
    """Main intent classifications"""
    PLAN = "plan"
    TASK = "task"
    OPINION_RESEARCH = "opinion_research"
    EVIDENCE_RESEARCH = "evidence_research"


class Category(str, Enum):
    """Health categories"""
    SLEEP = "sleep"
    NUTRITION = "nutrition"
    EXERCISE = "exercise"


class ConstraintType(str, Enum):
    """Types of constraints"""
    DATA_SOURCE = "data_source"
    OUTPUT_FORMAT = "output_format"
    SCOPE_BOUNDARY = "scope_boundary"
    TONE = "tone"
    SAFETY = "safety"
    PERSONALIZATION = "personalization"
    TEMPORAL = "temporal"


class Constraint(BaseModel):
    """Individual constraint definition"""
    id: str
    type: ConstraintType
    description: str
    validation_rule: Optional[str] = None
    severity: str = "medium"  # low, medium, high


class SubIntent(BaseModel):
    """Granular sub-intent with constraints"""
    id: str
    name: str
    description: str
    parent_category: Category
    parent_intent: IntentClass
    constraints: List[Constraint]
    example_queries: List[str]
    excluded_patterns: List[str]


class HierarchyNode(BaseModel):
    """Node in the constraint hierarchy"""
    id: str
    type: str  # cohort, intent, category, subintent
    name: str
    description: str
    children: List[str] = []
    constraints: List[Constraint] = []
    metadata: Dict = {}


# Define the constraint hierarchy
CONSTRAINT_HIERARCHY = {
    # Cohort definitions
    "cohorts": {
        Cohort.SEDENTARY_BEGINNER: {
            "description": "New to health habits, needs basic guidance",
            "allowed_intents": [IntentClass.PLAN, IntentClass.TASK],
            "complexity_level": "basic",
            "constraints": [
                Constraint(
                    id="c1",
                    type=ConstraintType.TONE,
                    description="Simple, encouraging language without jargon",
                    severity="high"
                ),
                Constraint(
                    id="c2",
                    type=ConstraintType.SCOPE_BOUNDARY,
                    description="Focus on foundational habits only",
                    severity="high"
                )
            ]
        },
        Cohort.HEALTH_ENTHUSIAST: {
            "description": "Regular exercise, decent sleep patterns",
            "allowed_intents": list(IntentClass),
            "complexity_level": "intermediate",
            "constraints": [
                Constraint(
                    id="c3",
                    type=ConstraintType.TONE,
                    description="Balanced scientific and practical advice",
                    severity="medium"
                )
            ]
        },
        Cohort.OPTIMIZER: {
            "description": "Tracking metrics, experimenting with protocols",
            "allowed_intents": list(IntentClass),
            "complexity_level": "advanced",
            "constraints": [
                Constraint(
                    id="c4",
                    type=ConstraintType.DATA_SOURCE,
                    description="Include quantitative data and metrics",
                    severity="medium"
                )
            ]
        },
        Cohort.BIOHACKER: {
            "description": "Advanced protocols, continuous monitoring",
            "allowed_intents": list(IntentClass),
            "complexity_level": "expert",
            "constraints": [
                Constraint(
                    id="c5",
                    type=ConstraintType.DATA_SOURCE,
                    description="Cutting-edge research and experimental protocols",
                    severity="low"
                )
            ]
        }
    },
    
    # Sub-intent examples
    "sub_intents": {
        "evidence_research_exercise_meta_analysis": SubIntent(
            id="er_ex_meta",
            name="Exercise Meta-Analysis Review",
            description="Synthesize meta-analyses on exercise interventions",
            parent_category=Category.EXERCISE,
            parent_intent=IntentClass.EVIDENCE_RESEARCH,
            constraints=[
                Constraint(
                    id="si1",
                    type=ConstraintType.DATA_SOURCE,
                    description="Only peer-reviewed meta-analyses from last 10 years",
                    severity="high"
                ),
                Constraint(
                    id="si2",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Include effect sizes with confidence intervals",
                    severity="high"
                ),
                Constraint(
                    id="si3",
                    type=ConstraintType.SCOPE_BOUNDARY,
                    description="No individual studies or anecdotes",
                    severity="high"
                )
            ],
            example_queries=[
                "What does research say about training frequency?",
                "Show me meta-analyses on volume for hypertrophy",
                "Compare strength vs hypertrophy training protocols"
            ],
            excluded_patterns=[
                "Design my workout",
                "What does [influencer] say?",
                "Remind me to train"
            ]
        ),
        
        "plan_nutrition_meal_planning": SubIntent(
            id="pl_nu_meal",
            name="Meal Planning",
            description="Create structured meal plans based on goals",
            parent_category=Category.NUTRITION,
            parent_intent=IntentClass.PLAN,
            constraints=[
                Constraint(
                    id="si4",
                    type=ConstraintType.PERSONALIZATION,
                    description="Consider user preferences and restrictions",
                    severity="high"
                ),
                Constraint(
                    id="si5",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Structured meal schedule with macros",
                    severity="medium"
                ),
                Constraint(
                    id="si6",
                    type=ConstraintType.SAFETY,
                    description="Ensure nutritional adequacy",
                    severity="high"
                )
            ],
            example_queries=[
                "Help me plan meals for muscle gain",
                "Create a weekly meal prep schedule",
                "Design a cutting diet plan"
            ],
            excluded_patterns=[
                "What's the research on intermittent fasting?",
                "Compare keto vs paleo",
                "Set meal reminders"
            ]
        ),
        
        "task_sleep_routine_automation": SubIntent(
            id="ta_sl_routine",
            name="Sleep Routine Automation",
            description="Automate bedtime routines and sleep tracking",
            parent_category=Category.SLEEP,
            parent_intent=IntentClass.TASK,
            constraints=[
                Constraint(
                    id="si7",
                    type=ConstraintType.TEMPORAL,
                    description="Time-based triggers and schedules",
                    severity="high"
                ),
                Constraint(
                    id="si8",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Actionable automation rules",
                    severity="high"
                ),
                Constraint(
                    id="si9",
                    type=ConstraintType.PERSONALIZATION,
                    description="Adapt to user's schedule",
                    severity="medium"
                )
            ],
            example_queries=[
                "Set up my evening wind-down routine",
                "Create sleep tracking reminders",
                "Automate bedroom environment controls"
            ],
            excluded_patterns=[
                "Why is sleep important?",
                "Research on sleep stages",
                "Design a sleep experiment"
            ]
        )
    }
}


def get_applicable_constraints(
    cohort: Cohort,
    intent: IntentClass,
    category: Category,
    sub_intent_id: Optional[str] = None
) -> List[Constraint]:
    """Get all applicable constraints for a given context"""
    constraints = []
    
    # Add cohort-level constraints
    cohort_data = CONSTRAINT_HIERARCHY["cohorts"].get(cohort, {})
    constraints.extend(cohort_data.get("constraints", []))
    
    # Add sub-intent specific constraints if provided
    if sub_intent_id:
        sub_intent = CONSTRAINT_HIERARCHY["sub_intents"].get(sub_intent_id)
        if sub_intent:
            constraints.extend(sub_intent.constraints)
    
    return constraints


def validate_intent_for_cohort(cohort: Cohort, intent: IntentClass) -> bool:
    """Check if an intent is allowed for a cohort"""
    cohort_data = CONSTRAINT_HIERARCHY["cohorts"].get(cohort, {})
    allowed_intents = cohort_data.get("allowed_intents", [])
    return intent in allowed_intents