"""
Tests for self_model router.
"""
import pytest
import respx
import httpx
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from ..main import app

client = TestClient(app)


@pytest.fixture
def mock_em_api():
    """Mock Epistemic Me API responses."""
    with respx.mock:
        yield


@pytest.mark.asyncio
async def test_create_self_model_success():
    """Test successful self model creation."""
    # Mock SDK response
    mock_response = {
        "id": "test-self-model-id",
        "user_id": "test-user-id",
        "name": "Test Model",
        "belief_systems": [],
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.self_model.sdk_create_self_model", new_callable=AsyncMock) as mock_sdk:
        mock_sdk.return_value = mock_response
        
        # Test request
        response = client.post(
            "/createSelfModel",
            json={"user_id": "test-user-id", "initial_name": "Test Model"},
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["user_id"] == "test-user-id"
        assert data["data"]["name"] == "Test Model"
        
        # Verify SDK was called with correct parameters
        mock_sdk.assert_called_once_with("test-user-id", ["default"])


@pytest.mark.asyncio
async def test_create_self_model_missing_auth():
    """Test self model creation without authorization header."""
    response = client.post(
        "/createSelfModel",
        json={"user_id": "test-user-id"}
    )
    
    assert response.status_code == 422  # Missing required header


@pytest.mark.asyncio
async def test_get_self_model_success():
    """Test successful self model retrieval."""
    # Mock SDK response
    mock_response = {
        "id": "test-self-model-id",
        "user_id": "test-user-id",
        "name": "Test Model",
        "belief_systems": [],
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.self_model.sdk_get_self_model", new_callable=AsyncMock) as mock_sdk:
        mock_sdk.return_value = mock_response
        
        # Test request
        response = client.get(
            "/getSelfModel?user_id=test-user-id",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["user_id"] == "test-user-id"
        
        # Verify SDK was called with correct parameters
        mock_sdk.assert_called_once_with("test-user-id")


@pytest.mark.asyncio
async def test_sync_self_model_success():
    """Test successful self model sync to profile."""
    # Mock SDK response
    mock_em_response = {
        "id": "test-self-model-id",
        "user_id": "test-user-id",
        "name": "Test Model",
        "belief_systems": [],
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.self_model.sdk_get_self_model", new_callable=AsyncMock) as mock_sdk:
        mock_sdk.return_value = mock_em_response
        
        with respx.mock:
            # Mock profile-mcp response
            respx.post("http://profile-mcp:8010/upsertSelfModel").mock(
                return_value=httpx.Response(200, json={"success": True})
            )
            
            # Test request
            response = client.post(
                "/syncSelfModelToProfile",
                json={"user_id": "test-user-id"},
                headers={"Authorization": "Bearer test-token"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert data["data"]["synced"] is True
            
            # Verify SDK was called
            mock_sdk.assert_called_once_with("test-user-id") 