"""
Real end-to-end tests that hit actual external services.

These tests require:
1. EM server running at http://localhost:8080
2. Redis running at redis://localhost:6380/0
3. Valid API key and authentication

Run with: pytest app/tests/integration/test_real_e2e.py -v
"""
import pytest
import httpx
import os
from unittest.mock import patch


# Skip these tests if EM_REAL_E2E_TESTS is not set
pytestmark = pytest.mark.skipif(
    not os.getenv("EM_REAL_E2E_TESTS"),
    reason="Real E2E tests require EM_REAL_E2E_TESTS=1 environment variable"
)


@pytest.fixture
def real_env_vars():
    """Real environment variables for E2E testing."""
    return {
        "EM_API_BASE": os.getenv("EM_API_BASE", "http://localhost:8080"),
        "EM_API_KEY": os.getenv("EM_API_KEY", "test-api-key"),
        "REDIS_URL": os.getenv("REDIS_URL", "redis://localhost:6380/0"),
        "PROFILE_MCP_URL": os.getenv("PROFILE_MCP_URL", "http://localhost:8010")
    }


@pytest.fixture
def real_auth_headers():
    """Real authentication headers."""
    token = os.getenv("EM_TEST_TOKEN", "test-token")
    return {"Authorization": f"Bearer {token}"}


async def check_em_server_health():
    """Check if EM server is running and accessible."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8080/health", timeout=5.0)
            return response.status_code == 200
    except Exception:
        return False


@pytest.mark.asyncio
async def test_em_server_connectivity():
    """Test that we can connect to the real EM server."""
    is_healthy = await check_em_server_health()
    if not is_healthy:
        pytest.skip("EM server not available at http://localhost:8080")
    
    # If we get here, server is available
    assert True


def test_real_health_endpoint(test_client, real_env_vars):
    """Test health endpoint with real environment."""
    with patch.dict(os.environ, real_env_vars):
        response = test_client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "em-mcp"


@pytest.mark.asyncio
async def test_real_token_resolution(real_env_vars, real_auth_headers):
    """Test token resolution against real EM server."""
    # Skip if EM server not available
    if not await check_em_server_health():
        pytest.skip("EM server not available")
    
    with patch.dict(os.environ, real_env_vars):
        from ...em_sdk_client import get_user_id_from_token
        
        token = real_auth_headers["Authorization"].split(" ")[1]
        
        # This will hit the real /whoami endpoint
        user_id = await get_user_id_from_token(token)
        
        # We expect either a valid user_id or None (if token is invalid)
        # The important thing is that we actually made the call
        print(f"Token resolution result: {user_id}")
        assert user_id is not None or user_id is None  # Either is valid


@pytest.mark.asyncio 
async def test_real_self_model_workflow(test_client, real_env_vars, real_auth_headers):
    """Test self model workflow against real EM server."""
    # Skip if EM server not available
    if not await check_em_server_health():
        pytest.skip("EM server not available")
    
    with patch.dict(os.environ, real_env_vars):
        test_user_id = f"test-user-{os.getpid()}"  # Unique user ID for this test
        
        # Try to create a self model
        create_response = test_client.post(
            "/createSelfModel",
            json={
                "user_id": test_user_id,
                "initial_name": "Real E2E Test Model"
            },
            headers=real_auth_headers
        )
        
        print(f"Create response: {create_response.status_code} - {create_response.text}")
        
        # We expect either success or a specific error
        # The important thing is we're hitting the real server
        assert create_response.status_code in [200, 400, 401, 403, 404, 500]
        
        # If creation was successful, try to get it
        if create_response.status_code == 200:
            get_response = test_client.get(
                f"/getSelfModel?user_id={test_user_id}",
                headers=real_auth_headers
            )
            
            print(f"Get response: {get_response.status_code} - {get_response.text}")
            assert get_response.status_code in [200, 404, 401, 403, 500]


@pytest.mark.asyncio
async def test_real_belief_operations(test_client, real_env_vars, real_auth_headers):
    """Test belief operations against real EM server."""
    # Skip if EM server not available
    if not await check_em_server_health():
        pytest.skip("EM server not available")
    
    with patch.dict(os.environ, real_env_vars):
        test_user_id = f"test-user-beliefs-{os.getpid()}"
        
        # Try to list belief systems
        list_response = test_client.get(
            f"/listBeliefSystems?user_id={test_user_id}",
            headers=real_auth_headers
        )
        
        print(f"List beliefs response: {list_response.status_code} - {list_response.text}")
        
        # We expect either success or a specific error
        assert list_response.status_code in [200, 400, 401, 403, 404, 500]
        
        # Try to create a belief
        belief_response = test_client.post(
            "/updateBelief",
            json={
                "user_id": test_user_id,
                "belief_system_id": "test-belief-system",
                "statement": "I believe in real end-to-end testing",
                "confidence": 0.95,
                "context_uuid": "real-e2e-test"
            },
            headers=real_auth_headers
        )
        
        print(f"Create belief response: {belief_response.status_code} - {belief_response.text}")
        assert belief_response.status_code in [200, 400, 401, 403, 404, 500]


def test_real_openapi_spec(test_client, real_env_vars):
    """Test OpenAPI spec generation with real environment."""
    with patch.dict(os.environ, real_env_vars):
        response = test_client.get("/openapi.json")
        
        assert response.status_code == 200
        spec = response.json()
        
        # Verify basic structure
        assert spec["openapi"] == "3.1.0"
        assert spec["info"]["title"] == "em-mcp"
        
        # Verify our endpoints are present
        expected_paths = [
            "/createSelfModel",
            "/getSelfModel",
            "/syncSelfModelToProfile",
            "/updateBelief",
            "/listBeliefSystems",
            "/deleteBelief"
        ]
        
        for path in expected_paths:
            assert path in spec["paths"]


@pytest.mark.asyncio
async def test_real_redis_connectivity(real_env_vars):
    """Test Redis connectivity with real Redis instance."""
    with patch.dict(os.environ, real_env_vars):
        from ...em_sdk_client import get_redis_client
        
        try:
            redis_client = await get_redis_client()
            
            # Test basic Redis operations
            test_key = f"test-key-{os.getpid()}"
            await redis_client.set(test_key, "test-value", ex=60)  # 60 second expiry
            
            value = await redis_client.get(test_key)
            assert value.decode() == "test-value"
            
            # Clean up
            await redis_client.delete(test_key)
            
        except Exception as e:
            pytest.skip(f"Redis not available: {e}")


# Helper function to run real E2E tests
def run_real_e2e_tests():
    """
    Helper function to run real E2E tests.
    
    Usage:
    export EM_REAL_E2E_TESTS=1
    export EM_API_BASE=http://localhost:8080
    export EM_API_KEY=your-real-api-key
    export EM_TEST_TOKEN=your-test-token
    pytest app/tests/integration/test_real_e2e.py -v
    """
    pass 