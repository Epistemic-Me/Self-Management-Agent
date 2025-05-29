"""
Pytest configuration for integration tests.
"""
import pytest
import asyncio
import httpx
import redis.asyncio as redis
from fastapi.testclient import TestClient
from unittest.mock import patch
import os

from ...main import app
from ...em_sdk_client import close_clients


# Removed custom event_loop fixture to avoid deprecation warning
# pytest-asyncio will handle event loop management automatically


@pytest.fixture
def test_client():
    """Create a test client for the FastAPI app."""
    with TestClient(app) as client:
        yield client


@pytest.fixture
async def redis_client():
    """Create a Redis client for testing."""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6380/0")
    client = redis.from_url(redis_url)
    
    # Clear test data before each test
    await client.flushdb()
    
    yield client
    
    # Clean up after test - simplified to avoid event loop issues
    try:
        await client.flushdb()
    except Exception:
        pass
    try:
        await client.aclose()
    except Exception:
        pass


@pytest.fixture
def mock_env_vars():
    """Mock environment variables for testing."""
    env_vars = {
        "EM_API_BASE": "http://localhost:8080",
        "EM_API_KEY": "test-api-key",
        "REDIS_URL": "redis://localhost:6380/0",
        "PROFILE_MCP_URL": "http://localhost:8010"
    }
    
    with patch.dict(os.environ, env_vars):
        yield env_vars


@pytest.fixture
def sample_self_model():
    """Sample self model data for testing."""
    return {
        "id": "test-self-model-id",
        "user_id": "test-user-id",
        "name": "Test Self Model",
        "belief_systems": [
            {
                "id": "test-belief-system-id",
                "self_model_id": "test-self-model-id",
                "name": "Core Beliefs",
                "beliefs": [
                    {
                        "id": "test-belief-id",
                        "belief_system_id": "test-belief-system-id",
                        "statement": "I believe in continuous learning",
                        "confidence": 0.9,
                        "context_uuid": "test-context"
                    }
                ]
            }
        ],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_belief():
    """Sample belief data for testing."""
    return {
        "id": "test-belief-id",
        "belief_system_id": "test-belief-system-id",
        "statement": "I believe in testing",
        "confidence": 0.85,
        "context_uuid": "test-context",
        "created_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def auth_headers():
    """Authentication headers for testing."""
    return {"Authorization": "Bearer test-token"} 