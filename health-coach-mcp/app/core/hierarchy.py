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
    TOOL_USAGE = "tool_usage"
    PRIVACY = "privacy"
    COMPLIANCE = "compliance"


class FailureMode(BaseModel):
    """Predicted failure mode for a constraint"""
    id: str
    description: str
    detection_method: str
    severity: str  # low, medium, high, critical
    example_violation: str
    mitigation_strategy: str


class Constraint(BaseModel):
    """Individual constraint definition"""
    id: str
    type: ConstraintType
    description: str
    validation_rule: Optional[str] = None
    severity: str = "medium"  # low, medium, high
    failure_modes: List[FailureMode] = []
    tools_required: List[str] = []
    context_dependent: bool = False


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
    
    # Complete sub-intent definitions
    "sub_intents": {
        # EVIDENCE RESEARCH SUB-INTENTS
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
        
        "evidence_research_exercise_rcts": SubIntent(
            id="er_ex_rcts",
            name="Exercise RCT Analysis",
            description="Analyze specific randomized controlled trials on exercise",
            parent_category=Category.EXERCISE,
            parent_intent=IntentClass.EVIDENCE_RESEARCH,
            constraints=[
                Constraint(
                    id="si10",
                    type=ConstraintType.DATA_SOURCE,
                    description="Only peer-reviewed RCTs with control groups",
                    severity="high"
                ),
                Constraint(
                    id="si11",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Include study design, participants, and limitations",
                    severity="high"
                ),
                Constraint(
                    id="si12",
                    type=ConstraintType.SCOPE_BOUNDARY,
                    description="Focus on specific study methodology and results",
                    severity="medium"
                )
            ],
            example_queries=[
                "Show me RCTs on high-intensity interval training",
                "Find studies comparing different rep ranges",
                "What RCTs exist on exercise timing?"
            ],
            excluded_patterns=[
                "What's the best workout?",
                "Design a program for me",
                "Set workout reminders"
            ]
        ),
        
        "evidence_research_exercise_mechanisms": SubIntent(
            id="er_ex_mechanisms",
            name="Exercise Mechanism Studies",
            description="Explore molecular and physiological mechanisms of exercise",
            parent_category=Category.EXERCISE,
            parent_intent=IntentClass.EVIDENCE_RESEARCH,
            constraints=[
                Constraint(
                    id="si13",
                    type=ConstraintType.DATA_SOURCE,
                    description="Peer-reviewed mechanistic studies and reviews",
                    severity="high"
                ),
                Constraint(
                    id="si14",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Explain pathways, signaling, and cellular responses",
                    severity="high"
                ),
                Constraint(
                    id="si15",
                    type=ConstraintType.TONE,
                    description="Scientific accuracy with accessible explanations",
                    severity="medium"
                )
            ],
            example_queries=[
                "How does resistance training trigger muscle growth?",
                "What are the molecular pathways of cardio adaptation?",
                "Explain the mechanisms of exercise-induced autophagy"
            ],
            excluded_patterns=[
                "What workout should I do?",
                "Compare different programs",
                "Schedule my training"
            ]
        ),
        
        "evidence_research_nutrition_meta_analysis": SubIntent(
            id="er_nu_meta",
            name="Nutrition Meta-Analysis Review",
            description="Synthesize meta-analyses on nutritional interventions",
            parent_category=Category.NUTRITION,
            parent_intent=IntentClass.EVIDENCE_RESEARCH,
            constraints=[
                Constraint(
                    id="si16",
                    type=ConstraintType.DATA_SOURCE,
                    description="Only peer-reviewed nutrition meta-analyses",
                    severity="high"
                ),
                Constraint(
                    id="si17",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Include effect sizes, heterogeneity, and quality assessment",
                    severity="high"
                ),
                Constraint(
                    id="si18",
                    type=ConstraintType.SAFETY,
                    description="Highlight safety considerations and contraindications",
                    severity="high"
                )
            ],
            example_queries=[
                "Meta-analyses on protein intake for muscle building",
                "What does research say about intermittent fasting?",
                "Show me meta-analyses on micronutrient supplementation"
            ],
            excluded_patterns=[
                "Create my meal plan",
                "What diet should I follow?",
                "Set meal reminders"
            ]
        ),
        
        "evidence_research_nutrition_rcts": SubIntent(
            id="er_nu_rcts",
            name="Nutrition RCT Analysis",
            description="Analyze specific nutrition randomized controlled trials",
            parent_category=Category.NUTRITION,
            parent_intent=IntentClass.EVIDENCE_RESEARCH,
            constraints=[
                Constraint(
                    id="si19",
                    type=ConstraintType.DATA_SOURCE,
                    description="Peer-reviewed nutrition RCTs with proper controls",
                    severity="high"
                ),
                Constraint(
                    id="si20",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Include study design, compliance, and dropout rates",
                    severity="high"
                ),
                Constraint(
                    id="si21",
                    type=ConstraintType.SCOPE_BOUNDARY,
                    description="Focus on specific nutritional interventions",
                    severity="medium"
                )
            ],
            example_queries=[
                "Find RCTs on ketogenic diets for weight loss",
                "Show me studies on meal timing effects",
                "What RCTs exist on plant-based diets?"
            ],
            excluded_patterns=[
                "Design my diet",
                "What should I eat?",
                "Track my meals"
            ]
        ),
        
        "evidence_research_sleep_meta_analysis": SubIntent(
            id="er_sl_meta",
            name="Sleep Meta-Analysis Review",
            description="Synthesize meta-analyses on sleep interventions and outcomes",
            parent_category=Category.SLEEP,
            parent_intent=IntentClass.EVIDENCE_RESEARCH,
            constraints=[
                Constraint(
                    id="si22",
                    type=ConstraintType.DATA_SOURCE,
                    description="Peer-reviewed sleep meta-analyses and systematic reviews",
                    severity="high"
                ),
                Constraint(
                    id="si23",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Include sleep metrics, effect sizes, and clinical significance",
                    severity="high"
                ),
                Constraint(
                    id="si24",
                    type=ConstraintType.SCOPE_BOUNDARY,
                    description="Focus on sleep quality, duration, and timing interventions",
                    severity="medium"
                )
            ],
            example_queries=[
                "Meta-analyses on sleep restriction effects",
                "Research on light exposure and circadian rhythm",
                "Show me meta-analyses on sleep and cognitive performance"
            ],
            excluded_patterns=[
                "Create my bedtime routine",
                "What sleep schedule should I follow?",
                "Set sleep reminders"
            ]
        ),
        
        "evidence_research_sleep_mechanisms": SubIntent(
            id="er_sl_mechanisms",
            name="Sleep Mechanism Studies",
            description="Explore neurobiological and physiological mechanisms of sleep",
            parent_category=Category.SLEEP,
            parent_intent=IntentClass.EVIDENCE_RESEARCH,
            constraints=[
                Constraint(
                    id="si25",
                    type=ConstraintType.DATA_SOURCE,
                    description="Peer-reviewed sleep neuroscience and physiology studies",
                    severity="high"
                ),
                Constraint(
                    id="si26",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Explain neural circuits, neurotransmitters, and sleep stages",
                    severity="high"
                ),
                Constraint(
                    id="si27",
                    type=ConstraintType.TONE,
                    description="Balance scientific detail with accessibility",
                    severity="medium"
                )
            ],
            example_queries=[
                "How does adenosine regulate sleep pressure?",
                "What are the mechanisms of REM sleep?",
                "Explain the neurochemistry of sleep-wake cycles"
            ],
            excluded_patterns=[
                "Help me sleep better",
                "Design my sleep routine",
                "Track my sleep"
            ]
        ),
        
        # OPINION RESEARCH SUB-INTENTS
        "opinion_research_exercise_influencers": SubIntent(
            id="or_ex_influencers",
            name="Exercise Influencer Protocols",
            description="Compare and analyze exercise protocols from fitness influencers",
            parent_category=Category.EXERCISE,
            parent_intent=IntentClass.OPINION_RESEARCH,
            constraints=[
                Constraint(
                    id="si28",
                    type=ConstraintType.DATA_SOURCE,
                    description="Publicly available influencer content and protocols",
                    severity="medium"
                ),
                Constraint(
                    id="si29",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Present multiple perspectives, highlight disagreements",
                    severity="high"
                ),
                Constraint(
                    id="si30",
                    type=ConstraintType.TONE,
                    description="Neutral analysis, avoid endorsements",
                    severity="high"
                )
            ],
            example_queries=[
                "Compare training philosophies of popular fitness influencers",
                "What do different coaches say about rest periods?",
                "How do influencer workout programs differ?"
            ],
            excluded_patterns=[
                "What does the research say?",
                "Design my workout",
                "Set training reminders"
            ]
        ),
        
        "opinion_research_nutrition_philosophies": SubIntent(
            id="or_nu_philosophies",
            name="Nutrition Philosophy Comparison",
            description="Compare different nutritional philosophies and approaches",
            parent_category=Category.NUTRITION,
            parent_intent=IntentClass.OPINION_RESEARCH,
            constraints=[
                Constraint(
                    id="si31",
                    type=ConstraintType.DATA_SOURCE,
                    description="Established nutrition philosophies and their proponents",
                    severity="medium"
                ),
                Constraint(
                    id="si32",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Present core principles, similarities, and differences",
                    severity="high"
                ),
                Constraint(
                    id="si33",
                    type=ConstraintType.TONE,
                    description="Balanced presentation without bias toward any approach",
                    severity="high"
                )
            ],
            example_queries=[
                "Compare paleo vs keto philosophies",
                "What do different nutrition experts say about carbs?",
                "How do plant-based and omnivore advocates differ?"
            ],
            excluded_patterns=[
                "What does the research prove?",
                "Create my meal plan",
                "Track my nutrition"
            ]
        ),
        
        "opinion_research_sleep_communities": SubIntent(
            id="or_sl_communities",
            name="Sleep Community Beliefs",
            description="Analyze sleep optimization beliefs from different communities",
            parent_category=Category.SLEEP,
            parent_intent=IntentClass.OPINION_RESEARCH,
            constraints=[
                Constraint(
                    id="si34",
                    type=ConstraintType.DATA_SOURCE,
                    description="Sleep optimization communities and their practices",
                    severity="medium"
                ),
                Constraint(
                    id="si35",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Present community beliefs, practices, and rationales",
                    severity="high"
                ),
                Constraint(
                    id="si36",
                    type=ConstraintType.SAFETY,
                    description="Flag potentially harmful practices",
                    severity="high"
                )
            ],
            example_queries=[
                "What do biohackers believe about sleep tracking?",
                "Compare sleep optimization approaches across communities",
                "What do different groups say about sleep supplements?"
            ],
            excluded_patterns=[
                "What does sleep research show?",
                "Design my sleep routine",
                "Set sleep reminders"
            ]
        ),
        
        # PLAN SUB-INTENTS
        "plan_exercise_program_design": SubIntent(
            id="pl_ex_program",
            name="Exercise Program Design",
            description="Create structured exercise programs based on goals",
            parent_category=Category.EXERCISE,
            parent_intent=IntentClass.PLAN,
            constraints=[
                Constraint(
                    id="si37",
                    type=ConstraintType.PERSONALIZATION,
                    description="Consider user fitness level, goals, and constraints",
                    severity="high"
                ),
                Constraint(
                    id="si38",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Structured program with progression and periodization",
                    severity="high"
                ),
                Constraint(
                    id="si39",
                    type=ConstraintType.SAFETY,
                    description="Include proper warm-up, form cues, and injury prevention",
                    severity="high"
                )
            ],
            example_queries=[
                "Design a strength training program for beginners",
                "Create a workout plan for muscle gain",
                "Help me plan a home workout routine"
            ],
            excluded_patterns=[
                "What does research say about training?",
                "What do influencers recommend?",
                "Remind me to workout"
            ]
        ),
        
        "plan_exercise_goal_setting": SubIntent(
            id="pl_ex_goals",
            name="Exercise Goal Setting",
            description="Help set realistic and specific exercise goals",
            parent_category=Category.EXERCISE,
            parent_intent=IntentClass.PLAN,
            constraints=[
                Constraint(
                    id="si40",
                    type=ConstraintType.PERSONALIZATION,
                    description="Base goals on current fitness level and lifestyle",
                    severity="high"
                ),
                Constraint(
                    id="si41",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="SMART goals with timelines and milestones",
                    severity="high"
                ),
                Constraint(
                    id="si42",
                    type=ConstraintType.TEMPORAL,
                    description="Include short-term and long-term objectives",
                    severity="medium"
                )
            ],
            example_queries=[
                "Help me set realistic fitness goals",
                "Create exercise milestones for my journey",
                "Plan my strength training progression"
            ],
            excluded_patterns=[
                "What's the best exercise?",
                "Research on goal setting",
                "Track my workouts"
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
                    id="si43",
                    type=ConstraintType.PERSONALIZATION,
                    description="Consider user preferences, restrictions, and goals",
                    severity="high"
                ),
                Constraint(
                    id="si44",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Structured meal schedule with macros and portions",
                    severity="high"
                ),
                Constraint(
                    id="si45",
                    type=ConstraintType.SAFETY,
                    description="Ensure nutritional adequacy and safety",
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
        
        "plan_nutrition_macro_distribution": SubIntent(
            id="pl_nu_macros",
            name="Macronutrient Distribution Planning",
            description="Plan optimal macronutrient ratios for specific goals",
            parent_category=Category.NUTRITION,
            parent_intent=IntentClass.PLAN,
            constraints=[
                Constraint(
                    id="si46",
                    type=ConstraintType.PERSONALIZATION,
                    description="Base ratios on individual goals and activity level",
                    severity="high"
                ),
                Constraint(
                    id="si47",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Specific gram amounts and percentages",
                    severity="high"
                ),
                Constraint(
                    id="si48",
                    type=ConstraintType.SAFETY,
                    description="Stay within healthy ranges for all macronutrients",
                    severity="high"
                )
            ],
            example_queries=[
                "Help me calculate macros for cutting",
                "Plan my protein, carb, and fat ratios",
                "Set up macronutrient targets for bulking"
            ],
            excluded_patterns=[
                "What does research say about macros?",
                "What do bodybuilders eat?",
                "Track my food intake"
            ]
        ),
        
        "plan_sleep_schedule_optimization": SubIntent(
            id="pl_sl_schedule",
            name="Sleep Schedule Optimization",
            description="Design optimal sleep schedules based on circadian biology",
            parent_category=Category.SLEEP,
            parent_intent=IntentClass.PLAN,
            constraints=[
                Constraint(
                    id="si49",
                    type=ConstraintType.PERSONALIZATION,
                    description="Consider chronotype, work schedule, and lifestyle",
                    severity="high"
                ),
                Constraint(
                    id="si50",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Specific bedtime, wake time, and transition periods",
                    severity="high"
                ),
                Constraint(
                    id="si51",
                    type=ConstraintType.TEMPORAL,
                    description="Include gradual adjustment strategies",
                    severity="medium"
                )
            ],
            example_queries=[
                "Help me optimize my sleep schedule",
                "Create a bedtime routine for better sleep",
                "Plan my sleep timing for shift work"
            ],
            excluded_patterns=[
                "What does sleep research show?",
                "What do sleep experts recommend?",
                "Set sleep reminders"
            ]
        ),
        
        "plan_sleep_environment_design": SubIntent(
            id="pl_sl_environment",
            name="Sleep Environment Design",
            description="Plan optimal sleep environment setup",
            parent_category=Category.SLEEP,
            parent_intent=IntentClass.PLAN,
            constraints=[
                Constraint(
                    id="si52",
                    type=ConstraintType.PERSONALIZATION,
                    description="Consider living situation, budget, and preferences",
                    severity="high"
                ),
                Constraint(
                    id="si53",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Specific recommendations for temperature, light, sound, etc.",
                    severity="high"
                ),
                Constraint(
                    id="si54",
                    type=ConstraintType.SAFETY,
                    description="Ensure safety and avoid harmful modifications",
                    severity="high"
                )
            ],
            example_queries=[
                "Help me optimize my bedroom for sleep",
                "Plan my sleep environment setup",
                "Design a sleep-friendly bedroom"
            ],
            excluded_patterns=[
                "What does research say about sleep environment?",
                "What products do sleep experts use?",
                "Automate my bedroom"
            ]
        ),
        
        # TASK SUB-INTENTS
        "task_exercise_tracking": SubIntent(
            id="ta_ex_tracking",
            name="Exercise Tracking Automation",
            description="Set up automated exercise tracking and logging",
            parent_category=Category.EXERCISE,
            parent_intent=IntentClass.TASK,
            constraints=[
                Constraint(
                    id="si55",
                    type=ConstraintType.PERSONALIZATION,
                    description="Match tracking to user's workout style and goals",
                    severity="high"
                ),
                Constraint(
                    id="si56",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Specific automation rules and tracking methods",
                    severity="high"
                ),
                Constraint(
                    id="si57",
                    type=ConstraintType.TEMPORAL,
                    description="Include timing, frequency, and reminder settings",
                    severity="medium"
                )
            ],
            example_queries=[
                "Set up automatic workout logging",
                "Create reminders for exercise tracking",
                "Automate my fitness data collection"
            ],
            excluded_patterns=[
                "What's the best workout?",
                "Research on exercise tracking",
                "Design my training program"
            ]
        ),
        
        "task_exercise_reminders": SubIntent(
            id="ta_ex_reminders",
            name="Exercise Reminder System",
            description="Create automated reminders for workouts and recovery",
            parent_category=Category.EXERCISE,
            parent_intent=IntentClass.TASK,
            constraints=[
                Constraint(
                    id="si58",
                    type=ConstraintType.PERSONALIZATION,
                    description="Adapt to user's schedule and preferences",
                    severity="high"
                ),
                Constraint(
                    id="si59",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Specific reminder triggers and messaging",
                    severity="high"
                ),
                Constraint(
                    id="si60",
                    type=ConstraintType.TEMPORAL,
                    description="Time-based triggers with flexible scheduling",
                    severity="high"
                )
            ],
            example_queries=[
                "Set up workout reminders",
                "Create rest day notifications",
                "Automate exercise prompts"
            ],
            excluded_patterns=[
                "What exercise should I do?",
                "Research on exercise timing",
                "Plan my workout schedule"
            ]
        ),
        
        "task_nutrition_meal_prep": SubIntent(
            id="ta_nu_prep",
            name="Meal Prep Automation",
            description="Automate meal preparation planning and reminders",
            parent_category=Category.NUTRITION,
            parent_intent=IntentClass.TASK,
            constraints=[
                Constraint(
                    id="si61",
                    type=ConstraintType.PERSONALIZATION,
                    description="Match to user's cooking skills and schedule",
                    severity="high"
                ),
                Constraint(
                    id="si62",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Specific prep schedules and shopping lists",
                    severity="high"
                ),
                Constraint(
                    id="si63",
                    type=ConstraintType.TEMPORAL,
                    description="Weekly and daily meal prep timing",
                    severity="high"
                )
            ],
            example_queries=[
                "Set up meal prep reminders",
                "Automate my grocery shopping list",
                "Create weekly meal prep schedule"
            ],
            excluded_patterns=[
                "What should I eat?",
                "Research on meal timing",
                "Design my meal plan"
            ]
        ),
        
        "task_nutrition_tracking": SubIntent(
            id="ta_nu_tracking",
            name="Nutrition Tracking Automation",
            description="Set up automated nutrition logging and monitoring",
            parent_category=Category.NUTRITION,
            parent_intent=IntentClass.TASK,
            constraints=[
                Constraint(
                    id="si64",
                    type=ConstraintType.PERSONALIZATION,
                    description="Match tracking detail to user's goals and compliance",
                    severity="high"
                ),
                Constraint(
                    id="si65",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Specific tracking methods and automation rules",
                    severity="high"
                ),
                Constraint(
                    id="si66",
                    type=ConstraintType.TEMPORAL,
                    description="Meal timing and logging frequency",
                    severity="medium"
                )
            ],
            example_queries=[
                "Set up automatic food logging",
                "Create macro tracking reminders",
                "Automate nutrition data collection"
            ],
            excluded_patterns=[
                "What should I eat?",
                "Research on nutrition tracking",
                "Plan my meals"
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
                    id="si67",
                    type=ConstraintType.TEMPORAL,
                    description="Time-based triggers and schedules",
                    severity="high"
                ),
                Constraint(
                    id="si68",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Actionable automation rules and device controls",
                    severity="high"
                ),
                Constraint(
                    id="si69",
                    type=ConstraintType.PERSONALIZATION,
                    description="Adapt to user's schedule and technology",
                    severity="high"
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
        ),
        
        "task_sleep_environment_control": SubIntent(
            id="ta_sl_environment",
            name="Sleep Environment Control",
            description="Automate sleep environment adjustments",
            parent_category=Category.SLEEP,
            parent_intent=IntentClass.TASK,
            constraints=[
                Constraint(
                    id="si70",
                    type=ConstraintType.PERSONALIZATION,
                    description="Match to user's available smart home devices",
                    severity="high"
                ),
                Constraint(
                    id="si71",
                    type=ConstraintType.OUTPUT_FORMAT,
                    description="Specific device controls and trigger conditions",
                    severity="high"
                ),
                Constraint(
                    id="si72",
                    type=ConstraintType.TEMPORAL,
                    description="Time-based and event-based automation triggers",
                    severity="high"
                )
            ],
            example_queries=[
                "Automate my bedroom temperature",
                "Set up smart lighting for sleep",
                "Control bedroom environment automatically"
            ],
            excluded_patterns=[
                "What's the best sleep environment?",
                "Research on sleep environment",
                "Plan my bedroom setup"
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