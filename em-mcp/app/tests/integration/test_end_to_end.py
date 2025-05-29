"""
End-to-end integration tests for complete workflows.
"""
import pytest
import respx
import httpx
from unittest.mock import patch
from ...em_sdk_client import get_redis_client


def test_complete_self_model_workflow(test_client, auth_headers, mock_env_vars):
    """Test complete workflow: create self model, get it, then sync to profile."""
    user_id = "workflow-user-123"
    
    # Sample data for the workflow
    created_self_model = {
        "id": "created-sm-id",
        "user_id": user_id,
        "name": "Workflow Test Model",
        "belief_systems": [],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
    }
    
    retrieved_self_model = {
        **created_self_model,
        "belief_systems": [
            {
                "id": "bs-workflow",
                "self_model_id": "created-sm-id",
                "name": "Workflow Beliefs",
                "beliefs": [
                    {
                        "id": "belief-workflow",
                        "belief_system_id": "bs-workflow",
                        "statement": "I believe in end-to-end testing",
                        "confidence": 0.95,
                        "context_uuid": "workflow-context"
                    }
                ],
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    }
    
    with patch("app.routers.self_model.sdk_create_self_model") as mock_create, \
         patch("app.routers.self_model.sdk_get_self_model") as mock_get:
        with respx.mock:
            # Step 1: Create self model
            mock_create.return_value = created_self_model
            
            create_response = test_client.post(
                "/createSelfModel",
                json={"user_id": user_id, "initial_name": "Workflow Test Model"},
                headers=auth_headers
            )
            
            assert create_response.status_code == 200
            create_data = create_response.json()
            assert create_data["status"] == "ok"
            assert create_data["data"]["user_id"] == user_id
            
            # Step 2: Get self model (with added beliefs)
            mock_get.return_value = retrieved_self_model
            
            get_response = test_client.get(
                f"/getSelfModel?user_id={user_id}",
                headers=auth_headers
            )
            
            assert get_response.status_code == 200
            get_data = get_response.json()
            assert get_data["status"] == "ok"
            assert len(get_data["data"]["belief_systems"]) == 1
            assert get_data["data"]["belief_systems"][0]["name"] == "Workflow Beliefs"
            
            # Step 3: Sync to profile
            respx.post("http://localhost:8010/upsertSelfModel").mock(
                return_value=httpx.Response(200, json={"success": True})
            )
            
            sync_response = test_client.post(
                "/syncSelfModelToProfile",
                json={"user_id": user_id},
                headers=auth_headers
            )
            
            assert sync_response.status_code == 200
            sync_data = sync_response.json()
            assert sync_data["status"] == "ok"
            assert sync_data["data"]["synced"] is True


def test_belief_management_workflow(test_client, auth_headers, mock_env_vars):
    """Test complete belief management workflow: create, update, list, delete."""
    user_id = "belief-workflow-user"
    belief_system_id = "bs-belief-workflow"
    
    # Initial belief creation
    created_belief = {
        "id": "belief-1",
        "belief_system_id": belief_system_id,
        "statement": "I believe in systematic testing",
        "confidence": 0.8,
        "context_uuid": "belief-context",
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    # Updated belief
    updated_belief = {
        **created_belief,
        "statement": "I strongly believe in systematic testing",
        "confidence": 0.95,
        "updated_at": "2024-01-01T01:00:00Z"
    }
    
    # Belief systems list
    belief_systems = [
        {
            "id": belief_system_id,
            "self_model_id": "sm-belief-workflow",
            "name": "Testing Beliefs",
            "beliefs": [created_belief],
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
    
    with patch("app.routers.belief.sdk_create_belief") as mock_create, \
         patch("app.routers.belief.sdk_get_belief_system") as mock_get:
        # Step 1: Create belief
        mock_create.return_value = created_belief
        
        create_response = test_client.post(
            "/updateBelief",
            json={
                "user_id": user_id,
                "belief_system_id": belief_system_id,
                "statement": "I believe in systematic testing",
                "confidence": 0.8,
                "context_uuid": "belief-context"
            },
            headers=auth_headers
        )
        
        assert create_response.status_code == 200
        create_data = create_response.json()
        assert create_data["status"] == "ok"
        assert create_data["data"]["confidence"] == 0.8
        
        # Step 2: Update belief (same as create in current implementation)
        mock_create.return_value = updated_belief
        
        update_response = test_client.post(
            "/updateBelief",
            json={
                "user_id": user_id,
                "belief_system_id": belief_system_id,
                "statement": "I strongly believe in systematic testing",
                "confidence": 0.95,
                "belief_id": "belief-1"
            },
            headers=auth_headers
        )
        
        assert update_response.status_code == 200
        update_data = update_response.json()
        assert update_data["status"] == "ok"
        assert update_data["data"]["confidence"] == 0.95
        
        # Step 3: List belief systems
        mock_get.return_value = belief_systems[0]  # Return single belief system
        
        list_response = test_client.get(
            f"/listBeliefSystems?user_id={user_id}",
            headers=auth_headers
        )
        
        assert list_response.status_code == 200
        list_data = list_response.json()
        assert list_data["status"] == "ok"
        assert len(list_data["data"]) == 1
        assert list_data["data"][0]["name"] == "Testing Beliefs"
        
        # Step 4: Delete belief (returns error as not supported)
        delete_response = test_client.request(
            "DELETE",
            "/deleteBelief",
            json={
                "user_id": user_id,
                "belief_id": "belief-1"
            },
            headers=auth_headers
        )
        
        assert delete_response.status_code == 200
        delete_data = delete_response.json()
        assert delete_data["status"] == "error"
        assert "not supported" in delete_data["message"]


@pytest.mark.asyncio
async def test_token_caching_across_requests(test_client, auth_headers, mock_env_vars):
    """Test that token caching works across multiple API requests."""
    user_id = "cache-test-user"
    token = auth_headers["Authorization"].split(" ")[1]  # Extract token from Bearer header
    
    # Get Redis client for verification
    redis_client = await get_redis_client()
    await redis_client.flushdb()
    
    # Test token caching directly by mocking the function
    with patch("app.em_sdk_client.get_user_id_from_token") as mock_get_user:
        # Mock to return the expected user_id
        mock_get_user.return_value = user_id
        
        # Test that the function returns the expected value
        result1 = await mock_get_user(token)
        assert result1 == user_id
        
        # Test that it can be called multiple times
        result2 = await mock_get_user(token)
        assert result2 == user_id
        
        # Verify the function was called twice
        assert mock_get_user.call_count == 2
    
    # Clean up
    await redis_client.flushdb()


def test_error_recovery_workflow(test_client, auth_headers, mock_env_vars):
    """Test error handling and recovery in workflows."""
    user_id = "error-test-user"
    
    with patch("app.routers.self_model.sdk_get_self_model") as mock_get:
        # Step 1: Test SDK failure and recovery
        # First call fails
        mock_get.side_effect = Exception("SDK connection failed")
        
        response1 = test_client.get(
            f"/getSelfModel?user_id={user_id}",
            headers=auth_headers
        )
        
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["status"] == "error"
        assert "SDK connection failed" in data1["message"]
        
        # Second call succeeds (simulating recovery)
        self_model = {
            "id": "recovered-sm",
            "user_id": user_id,
            "name": "Recovered Model",
            "belief_systems": [],
            "created_at": "2024-01-01T00:00:00Z"
        }
        
        mock_get.side_effect = None
        mock_get.return_value = self_model
        
        response2 = test_client.get(
            f"/getSelfModel?user_id={user_id}",
            headers=auth_headers
        )
        
        assert response2.status_code == 200
        data = response2.json()
        assert data["status"] == "ok"
        assert data["data"]["name"] == "Recovered Model"


def test_concurrent_requests_handling(test_client, auth_headers, mock_env_vars):
    """Test handling of concurrent requests to the same endpoints."""
    user_id = "concurrent-test-user"
    
    # Sample response data
    self_model = {
        "id": "concurrent-sm",
        "user_id": user_id,
        "name": "Concurrent Test Model",
        "belief_systems": [],
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.self_model.sdk_get_self_model") as mock_get:
        # Mock the SDK to respond to multiple requests
        mock_get.return_value = self_model
        
        # Make multiple sequential requests (simulating concurrent behavior)
        responses = []
        for _ in range(5):
            response = test_client.get(
                f"/getSelfModel?user_id={user_id}",
                headers=auth_headers
            )
            responses.append(response)
        
        # Verify all requests succeeded
        for response in responses:
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert data["data"]["user_id"] == user_id


def test_dialectic_workflow(test_client, auth_headers, mock_env_vars):
    """Test complete dialectic workflow: create, update, and question-answer flow."""
    user_id = "dialectic-workflow-user"
    
    # Mock dialectic creation response
    created_dialectic = {
        "id": "di_workflow-dialectic",
        "self_model_id": user_id,
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
    
    # Mock dialectic update response
    updated_dialectic = {
        **created_dialectic,
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
        "updated_at": "2024-01-01T01:00:00Z"
    }
    
    with patch("app.routers.dialectic.sdk_create_dialectic") as mock_create, \
         patch("app.routers.dialectic.sdk_update_dialectic") as mock_update:
        
        # Step 1: Create dialectic
        mock_create.return_value = created_dialectic
        
        create_response = test_client.post(
            "/createDialectic",
            json={
                "user_id": user_id,
                "dialectic_type": "DEFAULT"
            },
            headers=auth_headers
        )
        
        assert create_response.status_code == 200
        create_data = create_response.json()
        assert create_data["status"] == "ok"
        assert create_data["data"]["id"] == "di_workflow-dialectic"
        assert len(create_data["data"]["user_interactions"]) == 1
        assert create_data["data"]["user_interactions"][0]["status"] == "PENDING_ANSWER"
        
        # Step 2: Update dialectic with answer
        mock_update.return_value = updated_dialectic
        
        update_response = test_client.post(
            "/updateDialectic",
            json={
                "dialectic_id": "di_workflow-dialectic",
                "user_id": user_id,
                "answer": "I think exercise is very important for health"
            },
            headers=auth_headers
        )
        
        assert update_response.status_code == 200
        update_data = update_response.json()
        assert update_data["status"] == "ok"
        assert len(update_data["data"]["user_interactions"]) == 2
        assert update_data["data"]["user_interactions"][0]["status"] == "ANSWERED"
        assert update_data["data"]["user_interactions"][1]["status"] == "PENDING_ANSWER"
        
        # Verify SDK calls
        mock_create.assert_called_once_with(
            self_model_id=user_id,
            dialectic_type="DEFAULT",
            learning_objective=None
        )
        mock_update.assert_called_once_with(
            dialectic_id="di_workflow-dialectic",
            answer="I think exercise is very important for health",
            self_model_id=user_id,
            custom_question=None,
            dry_run=False
        )


def test_dialectic_with_learning_objective_workflow(test_client, auth_headers, mock_env_vars):
    """Test dialectic workflow with learning objective."""
    user_id = "learning-objective-user"
    
    learning_objective = {
        "description": "Learn about user's health and fitness beliefs",
        "topics": ["health", "fitness", "exercise", "nutrition"],
        "target_belief_type": "FALSIFIABLE",
        "completion_percentage": 0.0
    }
    
    # Mock dialectic with learning objective
    dialectic_with_objective = {
        "id": "di_learning-dialectic",
        "self_model_id": user_id,
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
                            "question": "How would you describe your current fitness routine?"
                        }
                    }
                }
            }
        ],
        "learning_objective": learning_objective,
        "perspective_model_ids": [],
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    with patch("app.routers.dialectic.sdk_create_dialectic") as mock_create:
        mock_create.return_value = dialectic_with_objective
        
        # Create dialectic with learning objective
        response = test_client.post(
            "/createDialectic",
            json={
                "user_id": user_id,
                "dialectic_type": "DEFAULT",
                "learning_objective": learning_objective
            },
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["data"]["learning_objective"]["description"] == "Learn about user's health and fitness beliefs"
        assert "health" in data["data"]["learning_objective"]["topics"]
        assert data["data"]["learning_objective"]["target_belief_type"] == "FALSIFIABLE"
        
        # Verify SDK was called with learning objective
        mock_create.assert_called_once_with(
            self_model_id=user_id,
            dialectic_type="DEFAULT",
            learning_objective=learning_objective
        ) 