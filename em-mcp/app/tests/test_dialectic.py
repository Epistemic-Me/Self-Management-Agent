"""
Tests for dialectic router.
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
async def test_create_dialectic_success():
    """Test successful dialectic creation."""
    # Mock SDK response
    mock_response = {
        "id": "di_test-dialectic-id",
        "self_model_id": "test-user-id",
        "agent": {
            "agent_type": "AGENT_TYPE_GPT_LATEST",
            "dialectic_type": "DEFAULT"
        },
        "user_interactions": [
            {
                "id": "interaction-1",
                "status": "PENDING_ANSWER",
                "type": "QUESTION_ANSWER",
                "interaction": {
                    "question_answer": {
                        "question": {
                            "question": "What are your thoughts on exercise?"
                        }
                    }
                }
            }
        ],
        "learning_objective": None,
        "perspective_model_ids": [],
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.dialectic.sdk_create_dialectic", new_callable=AsyncMock) as mock_sdk:
        mock_sdk.return_value = mock_response
        
        # Test request
        response = client.post(
            "/createDialectic",
            json={
                "user_id": "test-user-id",
                "dialectic_type": "DEFAULT"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["id"] == "di_test-dialectic-id"
        assert data["data"]["self_model_id"] == "test-user-id"
        assert data["data"]["agent"]["dialectic_type"] == "DEFAULT"
        
        # Verify SDK was called with correct parameters
        mock_sdk.assert_called_once_with(
            self_model_id="test-user-id",
            dialectic_type="DEFAULT",
            learning_objective=None
        )


@pytest.mark.asyncio
async def test_create_dialectic_with_learning_objective():
    """Test dialectic creation with learning objective."""
    learning_objective = {
        "description": "Learn about user's health beliefs",
        "topics": ["health", "fitness", "exercise"],
        "target_belief_type": "FALSIFIABLE",
        "completion_percentage": 0.0
    }
    
    mock_response = {
        "id": "di_test-dialectic-id",
        "self_model_id": "test-user-id",
        "agent": {
            "agent_type": "AGENT_TYPE_GPT_LATEST",
            "dialectic_type": "DEFAULT"
        },
        "user_interactions": [],
        "learning_objective": learning_objective,
        "perspective_model_ids": [],
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.dialectic.sdk_create_dialectic", new_callable=AsyncMock) as mock_sdk:
        mock_sdk.return_value = mock_response
        
        # Test request
        response = client.post(
            "/createDialectic",
            json={
                "user_id": "test-user-id",
                "dialectic_type": "DEFAULT",
                "learning_objective": learning_objective
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["learning_objective"]["description"] == "Learn about user's health beliefs"
        assert "health" in data["data"]["learning_objective"]["topics"]
        
        # Verify SDK was called with learning objective
        mock_sdk.assert_called_once_with(
            self_model_id="test-user-id",
            dialectic_type="DEFAULT",
            learning_objective=learning_objective
        )


@pytest.mark.asyncio
async def test_update_dialectic_success():
    """Test successful dialectic update."""
    # Mock SDK response
    mock_response = {
        "id": "di_test-dialectic-id",
        "self_model_id": "test-user-id",
        "agent": {
            "agent_type": "AGENT_TYPE_GPT_LATEST",
            "dialectic_type": "DEFAULT"
        },
        "user_interactions": [
            {
                "id": "interaction-1",
                "status": "ANSWERED",
                "type": "QUESTION_ANSWER",
                "interaction": {
                    "question_answer": {
                        "question": {
                            "question": "What are your thoughts on exercise?"
                        },
                        "answer": {
                            "user_answer": "I think exercise is very important for health"
                        }
                    }
                }
            },
            {
                "id": "interaction-2",
                "status": "PENDING_ANSWER",
                "type": "QUESTION_ANSWER",
                "interaction": {
                    "question_answer": {
                        "question": {
                            "question": "How often do you exercise?"
                        }
                    }
                }
            }
        ],
        "learning_objective": None,
        "perspective_model_ids": [],
        "updated_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.dialectic.sdk_update_dialectic", new_callable=AsyncMock) as mock_sdk:
        mock_sdk.return_value = mock_response
        
        # Test request
        response = client.post(
            "/updateDialectic",
            json={
                "dialectic_id": "di_test-dialectic-id",
                "user_id": "test-user-id",
                "answer": "I think exercise is very important for health"
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["id"] == "di_test-dialectic-id"
        assert len(data["data"]["user_interactions"]) == 2
        assert data["data"]["user_interactions"][0]["status"] == "ANSWERED"
        
        # Verify SDK was called with correct parameters
        mock_sdk.assert_called_once_with(
            dialectic_id="di_test-dialectic-id",
            answer="I think exercise is very important for health",
            self_model_id="test-user-id",
            custom_question=None,
            dry_run=False
        )


@pytest.mark.asyncio
async def test_update_dialectic_with_custom_question():
    """Test dialectic update with custom question."""
    mock_response = {
        "id": "di_test-dialectic-id",
        "self_model_id": "test-user-id",
        "agent": {
            "agent_type": "AGENT_TYPE_GPT_LATEST",
            "dialectic_type": "DEFAULT"
        },
        "user_interactions": [
            {
                "id": "interaction-1",
                "status": "ANSWERED",
                "type": "QUESTION_ANSWER",
                "interaction": {
                    "question_answer": {
                        "question": {
                            "question": "What is your opinion on meditation?"
                        },
                        "answer": {
                            "user_answer": "Meditation helps reduce stress"
                        }
                    }
                }
            }
        ],
        "learning_objective": None,
        "perspective_model_ids": [],
        "updated_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.dialectic.sdk_update_dialectic", new_callable=AsyncMock) as mock_sdk:
        mock_sdk.return_value = mock_response
        
        # Test request
        response = client.post(
            "/updateDialectic",
            json={
                "dialectic_id": "di_test-dialectic-id",
                "user_id": "test-user-id",
                "answer": "Meditation helps reduce stress",
                "custom_question": "What is your opinion on meditation?",
                "dry_run": True
            },
            headers={"Authorization": "Bearer test-token"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        
        # Verify SDK was called with custom question and dry_run
        mock_sdk.assert_called_once_with(
            dialectic_id="di_test-dialectic-id",
            answer="Meditation helps reduce stress",
            self_model_id="test-user-id",
            custom_question="What is your opinion on meditation?",
            dry_run=True
        )


@pytest.mark.asyncio
async def test_create_dialectic_missing_auth():
    """Test dialectic creation without authorization header."""
    response = client.post(
        "/createDialectic",
        json={
            "user_id": "test-user-id",
            "dialectic_type": "DEFAULT"
        }
    )
    
    assert response.status_code == 422  # Missing required header


@pytest.mark.asyncio
async def test_update_dialectic_missing_auth():
    """Test dialectic update without authorization header."""
    response = client.post(
        "/updateDialectic",
        json={
            "dialectic_id": "di_test-dialectic-id",
            "user_id": "test-user-id",
            "answer": "Test answer"
        }
    )
    
    assert response.status_code == 422  # Missing required header


@pytest.mark.asyncio
async def test_create_dialectic_invalid_auth():
    """Test dialectic creation with invalid authorization header."""
    response = client.post(
        "/createDialectic",
        json={
            "user_id": "test-user-id",
            "dialectic_type": "DEFAULT"
        },
        headers={"Authorization": "Invalid token"}
    )
    
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_dialectic_invalid_auth():
    """Test dialectic update with invalid authorization header."""
    response = client.post(
        "/updateDialectic",
        json={
            "dialectic_id": "di_test-dialectic-id",
            "user_id": "test-user-id",
            "answer": "Test answer"
        },
        headers={"Authorization": "Invalid token"}
    )
    
    assert response.status_code == 401 