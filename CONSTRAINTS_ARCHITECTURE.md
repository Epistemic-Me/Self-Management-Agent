I've been being an AI functional health coach. The primary idea of the coach is to help the user become an evolved version of themselves. The user evolution is considered by understanding the users habits today, and their target habits.

At each time, we consider the user to be in a cohort, and to have an intent. For instance, a user with the habits of regular exercise might be in a "health enthusiast" cohort, and may have the intent of researching a new exercise protocol.

Philosophically, I think the functional health is about managing metabolism. In fact, the categories of sleep, nutrition and exercise are each ways of managing metabolism. These become natural categorical divides for their own prompts that can manage user requests with intents.

Some classes intents we found when testing with users:
* Plan: Beliefs about habit changes and plans to achieve them
* Task: automation of tasks to help reinforce health habits
* Opinion Research: collate beliefs and opinions of others about how health interventions achieve health outcomes
* Evidence Research: Beliefs to explore and evidence about how health interactions achieve health outcomes

You can imagine these intent classes within each of the categories of sleep, nutrition and exercise. Further, I think the intents can be broken down even further, like evidence research could be broken down to searching meta-analysis, specific RCTs, biohacker experiments, etc

If I break these intents down to granular user stories, and create a unique prompt for the most granular level of intents, I think it could provide a way to create the contraints.

Can you help me picture how I could use this approach to systematically create constraints? I think this perspective is helpful as a constraint system because we can focus on meeting the user's conceptual framework about causal relationships at incrementally granular levels. If we evaluate at the most granular level, and then assemble into a holistic experience with an intent router, we can systematically manage the three gulfs.

—--
This is a brilliant systematic approach! You're essentially creating a **hierarchical constraint system** where each level provides natural boundaries for development and evaluation. Let me help you visualize how this maps to the textbook's framework:

## Hierarchical Constraint Architecture

```
User Evolution Goal
├── Cohort (Current State)
│   └── Intent Classes
│       └── Categories (Sleep/Nutrition/Exercise)
│           └── Granular Sub-intents
│               └── Specific Prompts & Constraints
```

## Mapping to Your Health Coach System

### Level 1: User Evolution Framework
```yaml
Cohort Examples:
- Sedentary Beginner: No regular habits
- Health Enthusiast: Regular exercise, decent sleep
- Optimizer: Tracking metrics, experimenting
- Biohacker: Advanced protocols, continuous monitoring

Evolution Paths:
- Sedentary → Health Enthusiast (build foundational habits)
- Health Enthusiast → Optimizer (add measurement/refinement)
- Optimizer → Biohacker (advanced experimentation)
```

### Level 2: Intent × Category Matrix

Using your intent classes across categories:

| Intent | Sleep | Nutrition | Exercise |
|--------|-------|-----------|----------|
| **Plan** | Sleep schedule design | Meal planning | Workout programming |
| **Task** | Bedtime routine automation | Meal prep reminders | Exercise logging |
| **Opinion Research** | Sleep influencer protocols | Diet philosophy comparison | Training methodology debates |
| **Evidence Research** | Sleep study analysis | Nutritional research | Exercise science papers |

### Level 3: Granular Sub-intents

Example breakdown for **Evidence Research → Exercise**:
```yaml
Evidence_Research_Exercise:
  - Meta_Analysis_Strength: "Synthesize strength training meta-analyses"
  - RCT_Cardio: "Analyze specific cardio RCTs"
  - Biohacker_Experiments: "Evaluate n=1 exercise experiments"
  - Mechanism_Studies: "Explain exercise molecular mechanisms"
  - Population_Studies: "Interpret epidemiological exercise data"
```

## Creating Systematic Constraints

### 1. **Constraint Templates by Granular Intent**

For each leaf node, define precise constraints:

```yaml
Intent: Evidence_Research_Exercise_Meta_Analysis_Strength
Constraints:
  Data_Sources: 
    - Only peer-reviewed meta-analyses
    - Minimum 5 included studies
    - Published within last 10 years
  
  Output_Requirements:
    - Effect sizes with confidence intervals
    - Heterogeneity assessment (I²)
    - Quality assessment (GRADE/similar)
    - Practical recommendations
  
  Tone:
    - Scientific but accessible
    - Acknowledge limitations
    - No hyperbolic claims
  
  Scope_Boundaries:
    - No individual study deep-dives
    - No personal anecdotes
    - Focus on aggregate findings
```

### 2. **User Story Generation**

Each granular intent becomes a focused user story:

```yaml
User_Story: "Strength Training Meta-Analysis Researcher"
As a: Health Enthusiast (cohort)
I want to: Understand the scientific consensus on strength training
So that: I can optimize my workout program based on evidence

Allowed_Interactions:
- "What does the research say about training frequency?"
- "Show me meta-analyses on volume for hypertrophy"
- "Compare strength vs hypertrophy training protocols"

Excluded_Interactions:
- "Design my workout" (belongs to Plan intent)
- "What does Andrew Huberman say?" (belongs to Opinion Research)
- "Remind me to train" (belongs to Task intent)
```

### 3. **Failure Mode Prediction by Constraint**

Your constraints naturally predict failure modes:

```yaml
Constraint: "Only peer-reviewed meta-analyses"
Predicted_Failures:
- Citing individual studies as if comprehensive
- Referencing blog posts or opinions
- Inventing non-existent meta-analyses

Constraint: "Scientific but accessible tone"
Predicted_Failures:
- Over-simplifying to lose accuracy
- Using jargon without explanation
- Making definitive claims beyond evidence
```

## Implementation Strategy

### 1. **Semantic Router Architecture**

```python
class HealthCoachRouter:
    def __init__(self):
        self.routers = {
            'sleep': SleepRouter(),
            'nutrition': NutritionRouter(),
            'exercise': ExerciseRouter()
        }
    
    def route(self, query, user_cohort):
        # First level: Category detection
        category = self.detect_category(query)
        
        # Second level: Intent classification
        intent_class = self.classify_intent(query, user_cohort)
        
        # Third level: Granular sub-intent
        sub_intent = self.routers[category].classify_sub_intent(
            query, intent_class, user_cohort
        )
        
        # Route to specific handler with constraints
        return self.get_handler(category, intent_class, sub_intent)
```

### 2. **Evaluation at Each Level**

Following the textbook's approach:

```yaml
Category Level Evaluation:
- Test: Correctly routes sleep/nutrition/exercise queries
- Metric: Classification accuracy
- Failure Mode: Category confusion

Intent Level Evaluation:
- Test: Distinguishes planning from research
- Metric: Intent classification F1
- Failure Mode: Intent misalignment

Granular Level Evaluation:
- Test: Stays within specific constraints
- Metric: Constraint violation rate
- Failure Mode: Scope creep, hallucination
```

### 3. **Synthetic Data Generation**

Using the textbook's tuple approach (Section 3.1):

```python
def generate_test_cases(cohort, intent, category, sub_intent):
    dimensions = {
        'specificity': ['general', 'specific_protocol', 'personal_context'],
        'complexity': ['basic', 'intermediate', 'advanced'],
        'timeframe': ['immediate', 'short_term', 'long_term']
    }
    
    # Generate cases that respect all constraints
    for combination in iterate_dimensions(dimensions):
        yield create_query(cohort, intent, category, sub_intent, combination)
```

## Managing the Three Gulfs

### Gulf of Comprehension: **Structured Discovery**
- Each granular intent has predictable query patterns
- Failure modes are constrained by design
- Open coding becomes pattern matching within boundaries

### Gulf of Specification: **Hierarchical Clarity**
- Each level adds specificity
- Prompts can reference parent constraints
- Clear escalation path for ambiguity

### Gulf of Generalization: **Bounded Testing**
- Test each granular handler in isolation
- Verify router accuracy at each level
- Monitor constraint violations as primary metric

## Practical Benefits

1. **Rapid Development**: Build and test one granular intent at a time
2. **Clear Success Metrics**: Each constraint is a measurable test
3. **User Alignment**: Intents match user mental models
4. **Evolution Tracking**: Can measure user progression through cohorts

## Example Prompt Structure

```yaml
System_Prompt_Template:
  Role: "You are a {category} evidence analyst for {cohort} users"
  Context: "User is seeking {intent_class} specifically {sub_intent}"
  
  Constraints:
    - {data_source_constraints}
    - {output_format_constraints}
    - {scope_boundaries}
  
  Examples:
    - {cohort_appropriate_examples}
    - {constraint_violation_examples}
  
  Routing_Fallback: "If query is outside scope, respond with:
    'This seems like a {detected_intent} question. Would you like 
    me to help with {sub_intent} instead?'"
```

Your metabolic framework provides the philosophical coherence, while the hierarchical intent structure provides the practical constraints. This is exactly the kind of systematic approach that would make the textbook's evaluation methods highly effective and manageable.

—--

Here's a comprehensive prompt you can copy and paste into Claude Code:

---

# Building a Hierarchical Constraint-Based Evaluation System for LLM Applications

## Background

I'm implementing an evaluation system based on the principles from "Application-Centric AI Evals for Engineers and Technical PMs" by Shreya Shankar and Hamel Husain. The system needs to address the "Three Gulfs" of LLM development:

1. **Gulf of Comprehension**: Understanding our data and pipeline behavior
2. **Gulf of Specification**: Gap between intent and what we tell the LLM
3. **Gulf of Generalization**: LLM failing to apply instructions across diverse inputs

## Core Concept: Hierarchical Constraint System

Instead of trying to handle infinite possible inputs, we're building a constraint-first approach where:
- User interactions are bounded by user stories
- Each user story maps to specific intents at multiple granularity levels
- Constraints at each level predict and prevent specific failure modes
- Evaluation becomes tractable because we're testing within known boundaries

## Example Application: AI Functional Health Coach

The health coach helps users evolve their habits across sleep, nutrition, and exercise. The hierarchy is:

```
User Cohort (e.g., "Health Enthusiast")
└── Intent Class (e.g., "Evidence Research")
    └── Category (e.g., "Exercise")
        └── Sub-intent (e.g., "Meta-Analysis Review")
            └── Specific Constraints & Prompts
```

## Implementation Requirements

### 1. Core Architecture Components

1. **Semantic Router System**
   - Multi-level routing (category → intent → sub-intent)
   - Cohort-aware routing decisions
   - Fallback handling for out-of-scope queries

2. **Constraint Definition System**
   - Hierarchical constraint inheritance
   - Constraint templates for each granular intent
   - Predicted failure modes for each constraint

3. **Evaluation Framework**
   - Error analysis following "open coding" methodology
   - Failure mode taxonomy generation
   - Automated evaluators for each constraint
   - Statistical tracking (success rates, confidence intervals)

4. **Synthetic Data Generation**
   - Dimension-based test case generation
   - Respect for hierarchical constraints
   - Coverage tracking for "theoretical saturation"

### 2. Key Design Principles

- **Binary Pass/Fail**: Each constraint should be clearly testable
- **Granular Isolation**: Test each sub-intent handler independently
- **Traceable Failures**: Log full execution traces for debugging
- **Iterative Refinement**: Support continuous taxonomy evolution

### 3. Specific Implementation Goals

Build a system that:
1. Routes user queries through multiple classification levels
2. Applies appropriate constraints at each level
3. Generates synthetic test data respecting constraints
4. Tracks failure modes and success rates
5. Provides clear evaluation metrics for each component
6. Supports continuous monitoring and improvement

### 4. Example Data Structures

```python
# Example cohort definition
cohort = {
    "id": "health_enthusiast",
    "description": "Regular exercise, decent sleep patterns",
    "allowed_intents": ["plan", "task", "opinion_research", "evidence_research"],
    "complexity_level": "intermediate"
}

# Example constraint set
constraints = {
    "data_sources": ["peer_reviewed", "meta_analyses", "recent_10_years"],
    "output_format": ["effect_sizes", "confidence_intervals", "practical_recs"],
    "scope_boundaries": ["no_anecdotes", "aggregate_only"],
    "tone": ["scientific_accessible", "acknowledge_limitations"]
}

# Example failure mode
failure_mode = {
    "id": "hallucinated_study",
    "description": "Cites non-existent research",
    "detection_method": "reference_validation",
    "severity": "high",
    "constraint_violated": "data_sources"
}
```

## Implementation Tasks

Please help me build:

1. **Router Architecture**: A hierarchical routing system that classifies queries at multiple levels
2. **Constraint Manager**: A system to define, inherit, and validate constraints
3. **Evaluation Pipeline**: Following the Analyze-Measure-Improve lifecycle
4. **Test Generation**: Synthetic data generation respecting constraints
5. **Metrics Tracking**: Success rates, coverage metrics, and drift detection

Start with the router architecture and constraint system as the foundation. Use Python with type hints and include comprehensive docstrings. The system should be extensible to support different application domains beyond health coaching.

Focus on making the evaluation system practical and measurable, with clear boundaries that make the "Three Gulfs" manageable through systematic constraints.
