"""
Integration tests for API endpoints with real HTTP calls.
"""
import pytest
import respx
import httpx
import json
from unittest.mock import patch


def test_health_endpoint_integration(test_client):
    """Test health endpoint returns correct response."""
    response = test_client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "em-mcp"


def test_root_endpoint_integration(test_client):
    """Test root endpoint returns service information."""
    response = test_client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "em-mcp"
    assert data["description"] == "FastAPI + fastapi-mcp proxy for Epistemic Me"
    assert data["version"] == "1.0.0"
    assert data["docs"] == "/docs"
    assert data["openapi"] == "/openapi.json"


def test_openapi_spec_generation(test_client):
    """Test OpenAPI specification is generated correctly."""
    response = test_client.get("/openapi.json")
    
    assert response.status_code == 200
    spec = response.json()
    
    # Verify basic OpenAPI structure
    assert spec["openapi"] == "3.1.0"
    assert spec["info"]["title"] == "em-mcp"
    
    # Verify all expected endpoints are present
    expected_paths = [
        "/createSelfModel",
        "/getSelfModel", 
        "/syncSelfModelToProfile",
        "/updateBelief",
        "/listBeliefSystems",
        "/deleteBelief",
        "/createDialectic",
        "/updateDialectic",
        "/health",
        "/"
    ]
    
    for path in expected_paths:
        assert path in spec["paths"]
    
    # Verify operation IDs are present and within limits
    for path, methods in spec["paths"].items():
        for method, details in methods.items():
            if "operationId" in details:
                op_id = details["operationId"]
                assert len(op_id) <= 64, f"Operation ID '{op_id}' exceeds 64 characters"


def test_create_self_model_integration(test_client, sample_self_model, auth_headers, mock_env_vars):
    """Test create self model endpoint with mocked SDK."""
    with patch("app.routers.self_model.sdk_create_self_model") as mock_create:
        # Mock SDK response
        mock_create.return_value = sample_self_model
        
        # Test the endpoint
        response = test_client.post(
            "/createSelfModel",
            json={"user_id": "test-user-id", "initial_name": "Test Model"},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["user_id"] == "test-user-id"
        assert data["data"]["name"] == "Test Self Model"


def test_get_self_model_integration(test_client, sample_self_model, auth_headers, mock_env_vars):
    """Test get self model endpoint with mocked SDK."""
    with patch("app.routers.self_model.sdk_get_self_model") as mock_get:
        # Mock SDK response
        mock_get.return_value = sample_self_model
        
        # Test the endpoint
        response = test_client.get(
            "/getSelfModel?user_id=test-user-id",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["user_id"] == "test-user-id"


def test_update_belief_integration(test_client, sample_belief, auth_headers, mock_env_vars):
    """Test update belief endpoint with mocked SDK."""
    with patch("app.routers.belief.sdk_create_belief") as mock_create:
        # Mock SDK response
        mock_create.return_value = sample_belief
        
        # Test creating a new belief
        response = test_client.post(
            "/updateBelief",
            json={
                "user_id": "test-user-id",
                "belief_system_id": "test-belief-system-id",
                "statement": "I believe in testing",
                "confidence": 0.85,
                "context_uuid": "test-context"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["statement"] == "I believe in testing"
        assert data["data"]["confidence"] == 0.85


def test_list_belief_systems_integration(test_client, auth_headers, mock_env_vars):
    """Test list belief systems endpoint with mocked SDK."""
    belief_system = {
        "id": "bs-1",
        "self_model_id": "sm-1",
        "name": "Core Beliefs",
        "beliefs": [],
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.belief.sdk_get_belief_system") as mock_get:
        # Mock SDK response
        mock_get.return_value = belief_system
        
        # Test the endpoint
        response = test_client.get(
            "/listBeliefSystems?user_id=test-user-id",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert len(data["data"]) == 1  # Returns single belief system wrapped in array
        assert data["data"][0]["name"] == "Core Beliefs"


def test_delete_belief_integration(test_client, auth_headers, mock_env_vars):
    """Test delete belief endpoint - should return error as not supported."""
    # Test the endpoint
    response = test_client.request(
        "DELETE",
        "/deleteBelief",
        json={
            "user_id": "test-user-id",
            "belief_id": "test-belief-id"
        },
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "error"
    assert "not supported" in data["message"]


def test_sync_self_model_integration(test_client, sample_self_model, auth_headers, mock_env_vars):
    """Test sync self model to profile endpoint."""
    with patch("app.routers.self_model.sdk_get_self_model") as mock_get:
        with respx.mock:
            # Mock SDK response
            mock_get.return_value = sample_self_model
            
            # Mock profile-mcp response - use the URL from mock_env_vars
            respx.post("http://localhost:8010/upsertSelfModel").mock(
                return_value=httpx.Response(200, json={"success": True})
            )
            
            # Test the endpoint
            response = test_client.post(
                "/syncSelfModelToProfile",
                json={"user_id": "test-user-id"},
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert data["data"]["synced"] is True


def test_authentication_required(test_client):
    """Test that endpoints require authentication."""
    endpoints_to_test = [
        ("POST", "/createSelfModel", {"user_id": "test"}),
        ("GET", "/getSelfModel?user_id=test", None),
        ("POST", "/syncSelfModelToProfile", {"user_id": "test"}),
        ("POST", "/updateBelief", {
            "user_id": "test",
            "belief_system_id": "test",
            "statement": "test",
            "confidence": 0.5
        }),
        ("GET", "/listBeliefSystems?user_id=test", None),
        ("DELETE", "/deleteBelief", {"user_id": "test", "belief_id": "test"}),
        ("POST", "/createDialectic", {"user_id": "test"}),
        ("POST", "/updateDialectic", {
            "dialectic_id": "test",
            "user_id": "test",
            "answer": "test"
        })
    ]
    
    for method, endpoint, json_data in endpoints_to_test:
        if method == "DELETE":
            response = test_client.request(method, endpoint, json=json_data)
        elif json_data:
            response = test_client.request(method, endpoint, json=json_data)
        else:
            response = test_client.request(method, endpoint)
        
        # Should return 422 for missing required header
        assert response.status_code == 422


def test_error_handling_integration(test_client, auth_headers, mock_env_vars):
    """Test error handling when SDK calls fail."""
    with patch("app.routers.self_model.sdk_create_self_model") as mock_create:
        # Mock SDK to raise an exception
        mock_create.side_effect = Exception("SDK connection failed")
        
        # Test that errors are properly handled
        response = test_client.post(
            "/createSelfModel",
            json={"user_id": "test-user-id"},
            headers=auth_headers
        )
        
        # Should return 200 with error status in response body
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert "SDK connection failed" in data["message"]


def test_create_dialectic_integration(test_client, auth_headers, mock_env_vars):
    """Test create dialectic endpoint with mocked SDK."""
    dialectic_response = {
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
    
    with patch("app.routers.dialectic.sdk_create_dialectic") as mock_create:
        # Mock SDK response
        mock_create.return_value = dialectic_response
        
        # Test the endpoint
        response = test_client.post(
            "/createDialectic",
            json={
                "user_id": "test-user-id",
                "dialectic_type": "DEFAULT"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["id"] == "di_test-dialectic-id"
        assert data["data"]["self_model_id"] == "test-user-id"
        assert data["data"]["agent"]["dialectic_type"] == "DEFAULT"


def test_update_dialectic_integration(test_client, auth_headers, mock_env_vars):
    """Test update dialectic endpoint with mocked SDK."""
    dialectic_response = {
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
    
    with patch("app.routers.dialectic.sdk_update_dialectic") as mock_update:
        # Mock SDK response
        mock_update.return_value = dialectic_response
        
        # Test the endpoint
        response = test_client.post(
            "/updateDialectic",
            json={
                "dialectic_id": "di_test-dialectic-id",
                "user_id": "test-user-id",
                "answer": "I think exercise is very important for health"
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["id"] == "di_test-dialectic-id"
        assert len(data["data"]["user_interactions"]) == 2
        assert data["data"]["user_interactions"][0]["status"] == "ANSWERED"


def test_create_dialectic_with_learning_objective_integration(test_client, auth_headers, mock_env_vars):
    """Test create dialectic with learning objective endpoint."""
    learning_objective = {
        "description": "Learn about user's health beliefs",
        "topics": ["health", "fitness", "exercise"],
        "target_belief_type": "FALSIFIABLE",
        "completion_percentage": 0.0
    }
    
    dialectic_response = {
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
    
    with patch("app.routers.dialectic.sdk_create_dialectic") as mock_create:
        # Mock SDK response
        mock_create.return_value = dialectic_response
        
        # Test the endpoint
        response = test_client.post(
            "/createDialectic",
            json={
                "user_id": "test-user-id",
                "dialectic_type": "DEFAULT",
                "learning_objective": learning_objective
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["learning_objective"]["description"] == "Learn about user's health beliefs"
        assert "health" in data["data"]["learning_objective"]["topics"] 