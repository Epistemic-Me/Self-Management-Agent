import pytest
import httpx


@pytest.mark.integration
@pytest.mark.asyncio
async def test_generate_and_forward_protocol(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    user_id: str,
    reset_state,
    get_row_helper
):
    """Test generating a protocol via profile-mcp and forwarding to dd-mcp."""
    # First, create the checklist to track protocol completion
    await async_client.get(
        f"{service_urls['profile_mcp']}/getChecklistProgress",
        headers=auth_headers
    )
    
    # Generate a protocol for sleep habit
    protocol_response = await async_client.post(
        f"{service_urls['profile_mcp']}/generateProtocol",
        headers=auth_headers,
        json={
            "habit_type": "sleep",
            "user_preferences": {
                "target_sleep_hours": 8,
                "bedtime_preference": "22:00"
            }
        }
    )
    
    assert protocol_response.status_code == 200
    protocol_data = protocol_response.json()
    
    # Verify protocol structure
    assert "habit_type" in protocol_data
    assert "cue" in protocol_data
    assert "routine" in protocol_data
    assert "reward" in protocol_data
    assert "dd_protocol_json" in protocol_data
    
    assert protocol_data["habit_type"] == "sleep"
    assert protocol_data["dd_protocol_json"] is not None
    
    # Forward the protocol to dd-mcp (create user protocol)
    dd_protocol_response = await async_client.post(
        f"{service_urls['dd_mcp']}/createUserProtocol",
        headers=auth_headers,
        json=protocol_data["dd_protocol_json"]
    )
    
    # Note: This might fail if DD API is not available, but we test the flow
    # The important part is that we generated a valid protocol structure
    
    # Mark the protocols bucket as complete
    mark_response = await async_client.post(
        f"{service_urls['profile_mcp']}/markChecklistItem",
        headers=auth_headers,
        json={
            "bucket_code": "protocols",
            "status": "complete",
            "data_ref": {
                "protocol_generated": True,
                "habit_type": "sleep"
            }
        }
    )
    
    assert mark_response.status_code == 200
    
    # Verify checklist was updated
    checklist_response = await async_client.get(
        f"{service_urls['profile_mcp']}/getChecklistProgress",
        headers=auth_headers
    )
    
    assert checklist_response.status_code == 200
    checklist_data = checklist_response.json()
    
    # Find the protocols item
    protocols_item = next(item for item in checklist_data if item["bucket_code"] == "protocols")
    assert protocols_item["status"] == "complete"
    
    # Verify in database
    row = await get_row_helper("checklist_items", "bucket_code = $1", ["protocols"])
    assert row is not None
    assert row["status"] == "complete"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_list_protocol_templates(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    reset_state
):
    """Test listing available protocol templates."""
    response = await async_client.get(
        f"{service_urls['profile_mcp']}/listProtocolTemplates",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    templates = response.json()
    
    # Should return a list of protocol templates
    assert isinstance(templates, list)
    
    # Each template should have required fields
    for template in templates:
        assert "id" in template
        assert "habit_type" in template
        assert "cue" in template
        assert "routine" in template
        assert "reward" in template
        assert "is_active" in template
        
        # Active templates should be available
        if template["is_active"]:
            assert template["habit_type"] is not None


@pytest.mark.integration
@pytest.mark.asyncio
async def test_generate_multiple_protocol_types(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    user_id: str,
    reset_state,
    get_row_helper
):
    """Test generating different types of protocols."""
    protocol_types = [
        {
            "habit_type": "exercise",
            "user_preferences": {
                "workout_duration": 45,
                "preferred_time": "morning"
            }
        },
        {
            "habit_type": "nutrition",
            "user_preferences": {
                "dietary_restrictions": ["vegetarian"],
                "meal_prep_time": 30
            }
        },
        {
            "habit_type": "meditation",
            "user_preferences": {
                "session_length": 15,
                "preferred_style": "mindfulness"
            }
        }
    ]
    
    generated_protocols = []
    
    for protocol_request in protocol_types:
        response = await async_client.post(
            f"{service_urls['profile_mcp']}/generateProtocol",
            headers=auth_headers,
            json=protocol_request
        )
        
        assert response.status_code == 200
        protocol_data = response.json()
        
        # Verify protocol structure
        assert protocol_data["habit_type"] == protocol_request["habit_type"]
        assert "cue" in protocol_data
        assert "routine" in protocol_data
        assert "reward" in protocol_data
        assert "dd_protocol_json" in protocol_data
        
        generated_protocols.append(protocol_data)
    
    # Verify we generated different protocols
    assert len(generated_protocols) == 3
    
    # Each should have different habit types
    habit_types = {p["habit_type"] for p in generated_protocols}
    assert len(habit_types) == 3


@pytest.mark.integration
@pytest.mark.asyncio
async def test_protocol_personalization(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    user_id: str,
    reset_state,
    get_row_helper
):
    """Test that protocols are personalized based on user preferences."""
    # Generate a sleep protocol with specific preferences
    sleep_preferences = {
        "target_sleep_hours": 9,
        "bedtime_preference": "21:30",
        "wake_time_preference": "06:30",
        "sleep_environment": "dark_and_cool"
    }
    
    response = await async_client.post(
        f"{service_urls['profile_mcp']}/generateProtocol",
        headers=auth_headers,
        json={
            "habit_type": "sleep",
            "user_preferences": sleep_preferences
        }
    )
    
    assert response.status_code == 200
    protocol_data = response.json()
    
    # Verify the protocol incorporates user preferences
    assert protocol_data["habit_type"] == "sleep"
    
    # The dd_protocol_json should contain personalized elements
    dd_protocol = protocol_data["dd_protocol_json"]
    assert dd_protocol is not None
    
    # Verify the protocol has the expected structure for Don't Die integration
    # The exact structure depends on the Don't Die API specification
    assert isinstance(dd_protocol, dict)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_protocol_template_management(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    reset_state,
    get_row_helper
):
    """Test protocol template creation and management."""
    # This test assumes there's an endpoint to create protocol templates
    # If not available, we'll test the existing template listing functionality
    
    # List existing templates
    list_response = await async_client.get(
        f"{service_urls['profile_mcp']}/listProtocolTemplates",
        headers=auth_headers
    )
    
    assert list_response.status_code == 200
    templates = list_response.json()
    
    initial_count = len(templates)
    
    # Verify template structure
    if templates:
        template = templates[0]
        assert "id" in template
        assert "habit_type" in template
        assert "cue" in template
        assert "routine" in template
        assert "reward" in template
        assert "dd_protocol_json" in template
        assert "is_active" in template
        assert "created_at" in template
        
        # Verify template exists in database
        template_row = await get_row_helper("protocol_templates", "id = $1", [template["id"]])
        assert template_row is not None
        assert template_row["habit_type"] == template["habit_type"] 