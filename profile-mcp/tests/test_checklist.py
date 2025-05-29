import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_get_checklist_progress_creates_and_returns_items(test_user):
    user_id = test_user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/getChecklistProgress", params={"user_id": user_id})
    assert response.status_code == 200
    data = response.json()["data"]
    assert "required" in data
    assert "items" in data
    assert isinstance(data["items"], list)
    assert any(item["code"] == "health_device" for item in data["items"])

@pytest.mark.asyncio
async def test_mark_checklist_item(test_user):
    user_id = test_user
    payload = {
        "user_id": user_id,
        "bucket_code": "health_device",
        "status": "complete",
        # 'data_ref' omitted: FastAPI cannot parse dicts as query params
        "source": "test"
    }
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/markChecklistItem", params=payload)
        assert response.status_code == 200, response.text
        data = response.json()["data"]
        assert data["code"] == "health_device"
        assert data["status"] == "complete"
        # Confirm update reflected in progress
        progress = (await ac.get("/getChecklistProgress", params={"user_id": user_id})).json()["data"]
        completed = progress["completed"]
        assert "health_device" in completed
