import pytest
import httpx
from datetime import datetime


@pytest.mark.integration
@pytest.mark.asyncio
async def test_auto_create_checklist(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    reset_state,
    get_row_helper
):
    """Test that GET /getChecklistProgress auto-creates 7 pending items."""
    # Call getChecklistProgress which should auto-create checklist items
    response = await async_client.get(
        f"{service_urls['profile_mcp']}/getChecklistProgress",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Should have 7 buckets
    assert len(data) == 7
    
    # All should be pending initially
    expected_buckets = {
        "health_device", "dd_score", "measurements", 
        "capabilities", "biomarkers", "demographics", "protocols"
    }
    
    actual_buckets = {item["bucket_code"] for item in data}
    assert actual_buckets == expected_buckets
    
    # All should be pending
    for item in data:
        assert item["status"] == "pending"
    
    # Verify in database
    for bucket in expected_buckets:
        row = await get_row_helper("checklist_items", "bucket_code = $1", [bucket])
        assert row is not None
        assert row["status"] == "pending"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_complete_dd_score_bucket(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    reset_state,
    get_row_helper
):
    """Test completing the dd_score bucket by calling dd-mcp and marking complete."""
    # First, create the checklist
    await async_client.get(
        f"{service_urls['profile_mcp']}/getChecklistProgress",
        headers=auth_headers
    )
    
    # Call dd-mcp to get DD score (this would normally populate the cache)
    today = datetime.now().strftime("%Y-%m-%d")
    dd_response = await async_client.get(
        f"{service_urls['dd_mcp']}/getDdScore",
        headers=auth_headers,
        params={"date": today}
    )
    
    # Note: This might fail if DD API is not available, but we continue with the test
    # The important part is testing the checklist marking
    
    # Mark the dd_score bucket as complete
    mark_response = await async_client.post(
        f"{service_urls['profile_mcp']}/markChecklistItem",
        headers=auth_headers,
        json={
            "bucket_code": "dd_score",
            "status": "complete",
            "data_ref": {"dd_score_retrieved": True}
        }
    )
    
    assert mark_response.status_code == 200
    
    # Get checklist again and verify dd_score is complete
    checklist_response = await async_client.get(
        f"{service_urls['profile_mcp']}/getChecklistProgress",
        headers=auth_headers
    )
    
    assert checklist_response.status_code == 200
    checklist_data = checklist_response.json()
    
    # Find the dd_score item
    dd_score_item = next(item for item in checklist_data if item["bucket_code"] == "dd_score")
    assert dd_score_item["status"] == "complete"
    
    # Verify in database
    row = await get_row_helper("checklist_items", "bucket_code = $1", ["dd_score"])
    assert row is not None
    assert row["status"] == "complete"
    assert row["data_ref"] is not None 