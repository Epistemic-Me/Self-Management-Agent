import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
import uuid

import redis.asyncio as redis

@pytest.mark.asyncio
async def test_selfmodel_roundtrip(test_user, auth_headers):
    """Test self model roundtrip using proper test fixtures."""
    user_id = test_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Upsert SelfModel
        resp = await ac.post("/upsertSelfModel", json={"user_id": user_id}, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        # Get SelfModel
        resp = await ac.get(f"/getSelfModel?user_id={user_id}", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"


@pytest.mark.asyncio
async def test_selfmodel_upsert_behavior(test_user, auth_headers):
    """Test that upsert returns the same model instead of creating duplicates."""
    user_id = test_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # First upsert - should create new model
        sm_data = {"user_id": user_id}
        response1 = await ac.post("/upsertSelfModel", json=sm_data, headers=auth_headers)
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["status"] == "ok"
        model1_id = data1["data"]["id"]
        model1_created_at = data1["data"]["created_at"]
        
        # Second upsert - should return the same model
        response2 = await ac.post("/upsertSelfModel", json=sm_data, headers=auth_headers)
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["status"] == "ok"
        model2_id = data2["data"]["id"]
        model2_created_at = data2["data"]["created_at"]
        
        # Verify it's the same model (same ID and creation time)
        assert model1_id == model2_id, "Upsert should return the same model, not create a new one"
        assert model1_created_at == model2_created_at, "Creation time should be identical for the same model"
