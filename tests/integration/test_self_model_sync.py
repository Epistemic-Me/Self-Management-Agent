import pytest
import httpx


@pytest.mark.integration
@pytest.mark.asyncio
async def test_create_and_sync_self_model(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    user_id: str,
    reset_state,
    get_row_helper
):
    """Test creating a self-model in em-mcp and syncing it to profile-mcp."""
    # Create self-model via em-mcp
    create_response = await async_client.post(
        f"{service_urls['em_mcp']}/createSelfModel",
        headers=auth_headers,
        json={"user_id": user_id}
    )
    
    assert create_response.status_code == 200
    self_model_data = create_response.json()
    assert "id" in self_model_data
    assert self_model_data["user_id"] == user_id
    
    # Sync to profile-mcp
    sync_response = await async_client.post(
        f"{service_urls['em_mcp']}/syncSelfModelToProfile",
        headers=auth_headers,
        json={
            "user_id": user_id,
            "self_model_id": self_model_data["id"]
        }
    )
    
    assert sync_response.status_code == 200
    
    # Verify self-model exists in profile-mcp database
    user_row = await get_row_helper("users", "id = $1", [user_id])
    assert user_row is not None
    
    self_model_row = await get_row_helper("self_models", "user_id = $1", [user_id])
    assert self_model_row is not None
    assert str(self_model_row["id"]) == self_model_data["id"]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_update_belief_and_sync(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    user_id: str,
    reset_state,
    get_row_helper
):
    """Test updating a belief via em-mcp and verifying it syncs to profile-mcp."""
    # First create a self-model
    create_response = await async_client.post(
        f"{service_urls['em_mcp']}/createSelfModel",
        headers=auth_headers,
        json={"user_id": user_id}
    )
    
    assert create_response.status_code == 200
    self_model_data = create_response.json()
    
    # Sync the self-model to profile-mcp
    await async_client.post(
        f"{service_urls['em_mcp']}/syncSelfModelToProfile",
        headers=auth_headers,
        json={
            "user_id": user_id,
            "self_model_id": self_model_data["id"]
        }
    )
    
    # Update/create a belief
    belief_statement = "I sleep 8 hours every night"
    belief_response = await async_client.post(
        f"{service_urls['em_mcp']}/updateBelief",
        headers=auth_headers,
        json={
            "user_id": user_id,
            "belief_system_name": "Health Beliefs",
            "statement": belief_statement,
            "confidence": 0.8
        }
    )
    
    assert belief_response.status_code == 200
    
    # Verify belief exists in profile-mcp database
    # First check if belief system was created
    belief_system_row = await get_row_helper(
        "belief_systems", 
        "name = $1", 
        ["Health Beliefs"]
    )
    assert belief_system_row is not None
    
    # Check if belief was created
    belief_row = await get_row_helper(
        "beliefs", 
        "statement = $1", 
        [belief_statement]
    )
    assert belief_row is not None
    assert belief_row["confidence"] == 0.8
    assert belief_row["belief_system_id"] == belief_system_row["id"] 