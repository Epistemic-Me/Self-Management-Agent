"""
Health Coach service for generating constraint-based responses
"""
import logging
from typing import Dict, Any, Optional, List
from openai import AsyncOpenAI
import httpx

from app.core.config import settings
from app.core.hierarchy import Cohort, CONSTRAINT_HIERARCHY
from app.models.chat import RoutingDecision
from app.services.retrievers import (
    ProfileRetriever, BeliefRetriever, HealthDataRetriever
)

logger = logging.getLogger(__name__)


class HealthCoach:
    """Generate health coaching responses with constraints"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.profile_retriever = ProfileRetriever()
        self.belief_retriever = BeliefRetriever()
        self.health_retriever = HealthDataRetriever()
        
    async def generate_response(
        self,
        query: str,
        routing_decision: RoutingDecision,
        user_cohort: Cohort,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate response based on routing decision and constraints"""
        try:
            # Get relevant context from retrievers
            retrieval_context = await self._gather_context(
                routing_decision, user_cohort, context
            )
            
            # Build system prompt with constraints
            system_prompt = self._build_system_prompt(
                routing_decision, user_cohort
            )
            
            # Build user prompt with context
            user_prompt = self._build_user_prompt(
                query, retrieval_context
            )
            
            # Generate response
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Response generation error: {str(e)}")
            return self._get_fallback_response(routing_decision)
    
    async def _gather_context(
        self,
        routing_decision: RoutingDecision,
        user_cohort: Cohort,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Gather relevant context from various sources"""
        gathered_context = {}
        
        # Get user profile if available
        if context and context.get("user_id"):
            profile = await self.profile_retriever.get_user_profile(
                context["user_id"]
            )
            if profile:
                gathered_context["user_profile"] = profile
        
        # Get relevant beliefs based on category
        if context and context.get("user_id"):
            beliefs = await self.belief_retriever.get_relevant_beliefs(
                user_id=context["user_id"],
                category=routing_decision.category
            )
            if beliefs:
                gathered_context["user_beliefs"] = beliefs
        
        # Get health data for certain intents
        if (routing_decision.intent_class.value in ["plan", "task"] and 
            context and context.get("user_id")):
            health_data = await self.health_retriever.get_recent_data(
                user_id=context["user_id"],
                category=routing_decision.category
            )
            if health_data:
                gathered_context["health_data"] = health_data
        
        return gathered_context
    
    def _build_system_prompt(
        self,
        routing_decision: RoutingDecision,
        user_cohort: Cohort
    ) -> str:
        """Build system prompt with constraints"""
        # Get cohort info
        cohort_data = CONSTRAINT_HIERARCHY["cohorts"][user_cohort]
        
        # Get sub-intent info if available
        sub_intent_info = ""
        if routing_decision.sub_intent_id:
            sub_intent = CONSTRAINT_HIERARCHY["sub_intents"].get(
                routing_decision.sub_intent_id
            )
            if sub_intent:
                sub_intent_info = f"""
                
Specific Focus: {sub_intent.name}
Description: {sub_intent.description}
                """
        
        # Format constraints
        constraint_text = self._format_constraints(routing_decision.constraints)
        
        prompt = f"""You are a health coach specializing in {routing_decision.category.value} 
for a {user_cohort.value} user ({cohort_data['description']}).

Intent Type: {routing_decision.intent_class.value}
{sub_intent_info}

CONSTRAINTS YOU MUST FOLLOW:
{constraint_text}

Guidelines:
- Stay within the scope of the identified intent
- Use language appropriate for the user's cohort level
- Be specific and actionable when possible
- If the query is outside your constraints, politely redirect

Remember: You are focused on {routing_decision.category.value} and the 
{routing_decision.intent_class.value} intent type."""
        
        return prompt
    
    def _build_user_prompt(
        self,
        query: str,
        context: Dict[str, Any]
    ) -> str:
        """Build user prompt with retrieved context"""
        prompt_parts = [f"User Query: {query}"]
        
        # Add user profile context
        if "user_profile" in context:
            profile = context["user_profile"]
            prompt_parts.append(f"\nUser Profile: {profile.get('summary', 'N/A')}")
        
        # Add relevant beliefs
        if "user_beliefs" in context:
            beliefs = context["user_beliefs"][:3]  # Limit to top 3
            belief_text = "\n".join([
                f"- {b.get('content', '')}" for b in beliefs
            ])
            prompt_parts.append(f"\nUser's Relevant Beliefs:\n{belief_text}")
        
        # Add health data
        if "health_data" in context:
            data = context["health_data"]
            prompt_parts.append(f"\nRecent Health Data: {data.get('summary', 'N/A')}")
        
        return "\n".join(prompt_parts)
    
    def _format_constraints(self, constraints: List) -> str:
        """Format constraints for the prompt"""
        if not constraints:
            return "- No specific constraints"
            
        formatted = []
        for constraint in constraints:
            severity_marker = "!" if constraint.severity == "high" else ""
            formatted.append(
                f"- [{constraint.type.value}] {constraint.description} {severity_marker}"
            )
            
        return "\n".join(formatted)
    
    def _get_fallback_response(self, routing_decision: RoutingDecision) -> str:
        """Generate fallback response when main generation fails"""
        return (
            f"I understand you're asking about {routing_decision.category.value}. "
            f"As a health coach, I'm here to help with your "
            f"{routing_decision.intent_class.value} needs. "
            f"Could you please rephrase your question so I can assist you better?"
        )