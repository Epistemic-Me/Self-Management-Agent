"""
Synthetic data generators for Health Coach evaluation
"""
import random
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import json

from app.core.hierarchy import Cohort, IntentClass, Category


@dataclass
class SyntheticUser:
    """Synthetic user profile for testing"""
    user_id: str
    cohort: Cohort
    demographics: Dict[str, Any]
    preferences: Dict[str, Any]
    health_goals: List[str]
    constraints: List[str]
    created_at: datetime


@dataclass
class SyntheticQuery:
    """Synthetic query for testing"""
    query_id: str
    text: str
    expected_category: Category
    expected_intent: IntentClass
    expected_sub_intent: Optional[str]
    user_cohort: Cohort
    context: Dict[str, Any]
    difficulty_level: str
    query_type: str


class SyntheticDataGenerator:
    """Generator for creating synthetic test data"""
    
    def __init__(self, seed: Optional[int] = None):
        if seed is not None:
            random.seed(seed)
    
    def generate_users(self, count: int = 50) -> List[SyntheticUser]:
        """Generate synthetic users across all cohorts"""
        users = []
        cohorts = list(Cohort)
        
        for i in range(count):
            cohort = random.choice(cohorts)
            user = SyntheticUser(
                user_id=f"user_{cohort.value}_{i:03d}",
                cohort=cohort,
                demographics={"age": random.randint(25, 65)},
                preferences={"workout_time": "morning"},
                health_goals=["improve fitness"],
                constraints=["limited time"],
                created_at=datetime.now()
            )
            users.append(user)
        
        return users
    
    def generate_queries(self, count: int = 200) -> List[SyntheticQuery]:
        """Generate synthetic queries"""
        queries = []
        cohorts = list(Cohort)
        categories = list(Category)
        intents = list(IntentClass)
        
        for i in range(count):
            cohort = random.choice(cohorts)
            category = random.choice(categories)
            intent = random.choice(intents)
            
            query = SyntheticQuery(
                query_id=f"query_{i:04d}",
                text=f"Help me with {category.value}",
                expected_category=category,
                expected_intent=intent,
                expected_sub_intent=None,
                user_cohort=cohort,
                context={},
                difficulty_level="medium",
                query_type="in_scope"
            )
            queries.append(query)
        
        return queries