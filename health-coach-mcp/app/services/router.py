"""
Semantic router for hierarchical intent classification
"""
import logging
from typing import Dict, List, Optional, Tuple
from openai import AsyncOpenAI
import json

from app.core.config import settings
from app.core.hierarchy import (
    Cohort, IntentClass, Category, SubIntent,
    CONSTRAINT_HIERARCHY, get_applicable_constraints,
    validate_intent_for_cohort
)
from app.models.chat import RoutingDecision, Provenance

logger = logging.getLogger(__name__)


class SemanticRouter:
    """Multi-level semantic router for health coaching queries"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        
    async def route(
        self,
        query: str,
        user_cohort: Cohort,
        context: Optional[Dict] = None
    ) -> RoutingDecision:
        """
        Route query through hierarchy:
        1. Category detection (sleep/nutrition/exercise)
        2. Intent classification (plan/task/research)
        3. Sub-intent identification
        """
        try:
            # Step 1: Detect category
            category = await self._detect_category(query)
            
            # Step 2: Classify intent
            intent_class = await self._classify_intent(query, user_cohort, category)
            
            # Validate intent for cohort
            if not validate_intent_for_cohort(user_cohort, intent_class):
                # Fallback to allowed intent
                cohort_data = CONSTRAINT_HIERARCHY["cohorts"][user_cohort]
                allowed_intents = cohort_data["allowed_intents"]
                intent_class = allowed_intents[0] if allowed_intents else IntentClass.PLAN
                
            # Step 3: Identify sub-intent
            sub_intent_id = await self._identify_sub_intent(
                query, category, intent_class, user_cohort
            )
            
            # Get applicable constraints
            constraints = get_applicable_constraints(
                user_cohort, intent_class, category, sub_intent_id
            )
            
            # Create routing decision
            decision = RoutingDecision(
                category=category,
                intent_class=intent_class,
                sub_intent_id=sub_intent_id,
                constraints=constraints,
                confidence=0.85,  # TODO: Calculate actual confidence
                reasoning=f"Routed to {category.value} > {intent_class.value} > {sub_intent_id or 'general'}"
            )
            
            return decision
            
        except Exception as e:
            logger.error(f"Routing error: {str(e)}")
            # Return default routing
            return RoutingDecision(
                category=Category.EXERCISE,
                intent_class=IntentClass.PLAN,
                sub_intent_id=None,
                constraints=[],
                confidence=0.0,
                reasoning=f"Error in routing: {str(e)}"
            )
    
    async def _detect_category(self, query: str) -> Category:
        """Detect health category from query"""
        prompt = f"""
        Classify this health-related query into one of these categories:
        - sleep: Related to sleep, rest, recovery, circadian rhythms
        - nutrition: Related to diet, food, supplements, meal planning
        - exercise: Related to physical activity, training, movement
        
        Query: "{query}"
        
        Respond with only the category name (sleep, nutrition, or exercise).
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a health query classifier."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=10
        )
        
        category_str = response.choices[0].message.content.strip().lower()
        
        # Map to enum
        category_map = {
            "sleep": Category.SLEEP,
            "nutrition": Category.NUTRITION,
            "exercise": Category.EXERCISE
        }
        
        return category_map.get(category_str, Category.EXERCISE)
    
    async def _classify_intent(
        self,
        query: str,
        user_cohort: Cohort,
        category: Category
    ) -> IntentClass:
        """Classify intent based on query and context"""
        cohort_data = CONSTRAINT_HIERARCHY["cohorts"][user_cohort]
        allowed_intents = cohort_data["allowed_intents"]
        
        intent_descriptions = {
            IntentClass.PLAN: "Creating plans, goals, or structured approaches",
            IntentClass.TASK: "Automating tasks, setting reminders, tracking",
            IntentClass.OPINION_RESEARCH: "Gathering opinions, comparing philosophies",
            IntentClass.EVIDENCE_RESEARCH: "Scientific research, studies, evidence"
        }
        
        # Build prompt with allowed intents only
        intent_options = "\n".join([
            f"- {intent.value}: {intent_descriptions[intent]}"
            for intent in allowed_intents
        ])
        
        prompt = f"""
        Classify this {category.value}-related query into one of these intent types:
        
        {intent_options}
        
        User cohort: {user_cohort.value} ({cohort_data['description']})
        Query: "{query}"
        
        Respond with only the intent type name.
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an intent classifier for health queries."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=20
        )
        
        intent_str = response.choices[0].message.content.strip().lower()
        
        # Map to enum
        for intent in IntentClass:
            if intent.value == intent_str:
                return intent
                
        # Default to first allowed intent
        return allowed_intents[0] if allowed_intents else IntentClass.PLAN
    
    async def _identify_sub_intent(
        self,
        query: str,
        category: Category,
        intent_class: IntentClass,
        user_cohort: Cohort
    ) -> Optional[str]:
        """Identify specific sub-intent if applicable"""
        # Get matching sub-intents
        matching_sub_intents = []
        
        for sub_intent_id, sub_intent in CONSTRAINT_HIERARCHY["sub_intents"].items():
            if (sub_intent.parent_category == category and 
                sub_intent.parent_intent == intent_class):
                matching_sub_intents.append((sub_intent_id, sub_intent))
        
        if not matching_sub_intents:
            return None
            
        # Build prompt for sub-intent selection
        sub_intent_options = "\n".join([
            f"- {sid}: {si.name} - {si.description}"
            for sid, si in matching_sub_intents
        ])
        
        prompt = f"""
        Select the most specific sub-intent for this query, or 'none' if none match well.
        
        Category: {category.value}
        Intent: {intent_class.value}
        Query: "{query}"
        
        Available sub-intents:
        {sub_intent_options}
        
        Respond with only the sub-intent ID or 'none'.
        """
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a precise sub-intent classifier."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=50
        )
        
        result = response.choices[0].message.content.strip()
        
        if result.lower() == "none":
            return None
            
        # Validate the sub-intent ID
        for sid, _ in matching_sub_intents:
            if sid == result:
                return sid
                
        return None
    
    def create_provenance(
        self,
        routing_decision: RoutingDecision,
        user_cohort: Cohort,
        trace_id: str
    ) -> Provenance:
        """Create provenance data from routing decision"""
        return Provenance(
            cohort=user_cohort,
            intent_class=routing_decision.intent_class,
            category=routing_decision.category,
            sub_intent=routing_decision.sub_intent_id,
            constraints_applied=[c.dict() for c in routing_decision.constraints],
            confidence=routing_decision.confidence,
            trace_id=trace_id,
            reasoning=routing_decision.reasoning
        )