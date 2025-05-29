"""
Epistemic Me SDK client for em-mcp service.
Replaces direct HTTP calls with SDK integration.
"""
import os
import redis.asyncio as redis
from typing import Optional, Dict, Any, List
import logging
import asyncio
from functools import wraps

import epistemic_me

logger = logging.getLogger(__name__)

# Environment variables
EM_API_BASE = os.getenv("EM_API_BASE", "http://localhost:8080")
EM_API_KEY = os.getenv("EM_API_KEY", "changeme")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Global Redis connection
_redis_client: Optional[redis.Redis] = None

# Initialize SDK on module load
epistemic_me.set_api_key(EM_API_KEY)
epistemic_me.set_base_url(EM_API_BASE)


def async_sdk_call(func):
    """Decorator to handle SDK calls that might be synchronous."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Run the SDK call in a thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, func, *args, **kwargs)
    return wrapper


async def get_redis_client() -> redis.Redis:
    """Get or create Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(REDIS_URL)
    return _redis_client


async def close_clients():
    """Close Redis client (SDK client doesn't need explicit closing)."""
    global _redis_client
    if _redis_client:
        try:
            await _redis_client.aclose()
        except Exception as e:
            logger.warning(f"Error closing Redis client: {e}")
        finally:
            _redis_client = None


async def get_user_id_from_token(token: str) -> Optional[str]:
    """Get user ID from token, using cache."""
    redis_client = await get_redis_client()
    
    # Check cache first
    cache_key = f"token:{token}"
    cached_user_id = await redis_client.get(cache_key)
    if cached_user_id:
        return cached_user_id.decode() if isinstance(cached_user_id, bytes) else cached_user_id
    
    # Make API call to validate token
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{EM_API_BASE}/whoami",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                user_id = data.get("user_id")
                if user_id:
                    # Cache for 24 hours
                    await redis_client.setex(cache_key, 86400, user_id)
                    return user_id
            
            # API call failed or no user_id in response
            logger.warning(f"Token validation failed: {response.status_code}")
            return None
            
    except Exception as e:
        logger.error(f"Error validating token: {e}")
        return None


# SDK wrapper functions using the simple pattern from the PR
@async_sdk_call
def create_self_model(user_id: str, philosophies: List[str] = None) -> Dict[str, Any]:
    """Create a new self model via SDK."""
    if philosophies is None:
        philosophies = ["default"]
    return epistemic_me.SelfModel.create(user_id, philosophies)


@async_sdk_call
def get_self_model(user_id: str) -> Dict[str, Any]:
    """Get self model via SDK."""
    return epistemic_me.SelfModel.retrieve(user_id)


@async_sdk_call
def get_belief_system(user_id: str) -> Dict[str, Any]:
    """Get belief system via SDK."""
    return epistemic_me.SelfModel.retrieve_belief_system(user_id)


@async_sdk_call
def list_dialectics(user_id: str) -> Dict[str, Any]:
    """List dialectics via SDK."""
    return epistemic_me.SelfModel.list_dialectics(user_id)


@async_sdk_call
def create_philosophy(description: str, extrapolate_contexts: bool = False) -> Dict[str, Any]:
    """Create philosophy via SDK."""
    return epistemic_me.Philosophy.create(description, extrapolate_contexts)


@async_sdk_call
def create_user(developer_id: str, name: str, email: str) -> Dict[str, Any]:
    """Create user via SDK."""
    return epistemic_me.User.create(developer_id, name, email)


@async_sdk_call
def create_developer(name: str, email: str) -> Dict[str, Any]:
    """Create developer via SDK."""
    return epistemic_me.Developer.create(name=name, email=email)


# Belief operations (using simplified SDK syntax)
@async_sdk_call
def create_belief(self_model_id: str, belief_content: str) -> Dict[str, Any]:
    """Create belief via SDK."""
    return epistemic_me.Belief.create(self_model_id, belief_content)


@async_sdk_call
def list_beliefs(self_model_id: str) -> List[Dict[str, Any]]:
    """List beliefs via SDK."""
    return epistemic_me.Belief.list(self_model_id)


# Dialectic operations
@async_sdk_call
def create_dialectic(self_model_id: str, dialectic_type: str = "DEFAULT", learning_objective: Dict[str, Any] = None) -> Dict[str, Any]:
    """Create dialectic via SDK."""
    from epistemic_me.models import DialecticType
    
    # Convert string to enum if needed
    if isinstance(dialectic_type, str):
        dialectic_type = getattr(DialecticType, dialectic_type, DialecticType.DEFAULT)
    
    # Convert learning objective dict to object if provided
    learning_obj = None
    if learning_objective:
        from epistemic_me.dialectic import LearningObjective
        learning_obj = LearningObjective(**learning_objective)
    
    return epistemic_me.Dialectic.create(
        self_model_id=self_model_id,
        dialectic_type=dialectic_type,
        learning_objective=learning_obj
    )


@async_sdk_call
def update_dialectic(dialectic_id: str, answer: str, self_model_id: str, custom_question: str = None, dry_run: bool = False) -> Dict[str, Any]:
    """Update dialectic via SDK."""
    return epistemic_me.Dialectic.update(
        id=dialectic_id,
        answer=answer,
        self_model_id=self_model_id
    ) 