"""
Tests for belief router.
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
async def test_update_belief_create_success():
    """Test successful belief creation."""
    # Mock SDK response
    mock_response = {
        "id": "test-belief-id",
        "belief_system_id": "test-bs-id",
        "statement": "I believe in testing",
        "confidence": 0.9,
        "context_uuid": "test-context",
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.belief.sdk_create_belief", new_callable=AsyncMock) as mock_sdk:
        mock_sdk.return_value = mock_response
        
        # Test request
        response = client.post(
            "/updateBelief",
            json={
                "user_id": "test-user-id",
                "belief_system_id": "test-bs-id",
                "statement": "I believe in testing",
                "confidence": 0.9,
                "context_uuid": "test-context"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["statement"] == "I believe in testing"
        assert data["data"]["confidence"] == 0.9
        
        # Verify SDK was called with correct parameters
        mock_sdk.assert_called_once_with("test-user-id", "I believe in testing (confidence: 0.9)")


@pytest.mark.asyncio
async def test_update_belief_update_success():
    """Test successful belief update (treated as create in SDK)."""
    # Mock SDK response
    mock_response = {
        "id": "test-belief-id",
        "belief_system_id": "test-bs-id",
        "statement": "Updated belief",
        "confidence": 0.8,
        "updated_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.belief.sdk_create_belief", new_callable=AsyncMock) as mock_sdk:
        mock_sdk.return_value = mock_response
        
        # Test request
        response = client.post(
            "/updateBelief",
            json={
                "user_id": "test-user-id",
                "belief_system_id": "test-bs-id",
                "statement": "Updated belief",
                "confidence": 0.8,
                "belief_id": "test-belief-id"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["statement"] == "Updated belief"
        
        # Verify SDK was called (update treated as create)
        mock_sdk.assert_called_once_with("test-user-id", "Updated belief (confidence: 0.8)")


@pytest.mark.asyncio
async def test_list_belief_systems_success():
    """Test successful belief systems listing."""
    # Mock SDK response (single belief system)
    mock_response = {
        "id": "test-bs-1",
        "self_model_id": "test-sm-id",
        "name": "Core Beliefs",
        "beliefs": [],
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.belief.sdk_get_belief_system", new_callable=AsyncMock) as mock_sdk:
        mock_sdk.return_value = mock_response
        
        # Test request
        response = client.get(
            "/listBeliefSystems?user_id=test-user-id",
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert len(data["data"]) == 1  # SDK returns single belief system
        assert data["data"][0]["name"] == "Core Beliefs"
        
        # Verify SDK was called
        mock_sdk.assert_called_once_with("test-user-id")


@pytest.mark.asyncio
async def test_delete_belief_not_supported():
    """Test belief deletion - not supported by SDK."""
    # Test request - use request method for DELETE with JSON body
    response = client.request(
        "DELETE",
        "/deleteBelief",
        json={
            "user_id": "test-user-id",
            "belief_id": "test-belief-id"
        },
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "error"
    assert "not supported" in data["message"]


@pytest.mark.asyncio
async def test_update_belief_missing_auth():
    """Test belief update without authorization header."""
    response = client.post(
        "/updateBelief",
        json={
            "user_id": "test-user-id",
            "belief_system_id": "test-bs-id",
            "statement": "Test belief",
            "confidence": 0.9
        }
    )
    
    assert response.status_code == 422  # Missing required header 