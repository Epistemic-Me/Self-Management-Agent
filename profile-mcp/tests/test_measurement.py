import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from datetime import datetime
import uuid


@pytest.mark.asyncio
async def test_upsert_measurement_success(test_user, auth_headers):
    """Test successful measurement creation."""
    user_id = test_user
    measurement_data = {
        "user_id": user_id,
        "type": "weight",
        "value": 70.5,
        "unit": "kg",
        "captured_at": datetime.utcnow().isoformat()
    }
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/upsertMeasurement", json=measurement_data, headers=auth_headers
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "data" in data


@pytest.mark.asyncio
async def test_upsert_measurement_unauthorized():
    """Test measurement creation without authentication."""
    measurement_data = {
        "user_id": str(uuid.uuid4()),
        "type": "weight",
        "value": 70.5,
        "unit": "kg",
        "captured_at": datetime.utcnow().isoformat() + "Z"
    }
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/upsertMeasurement", json=measurement_data)
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_upsert_measurement_validation_error(auth_headers):
    """Test measurement creation with invalid data."""
    measurement_data = {
        "user_id": "invalid-uuid",
        "type": "",  # Empty type
        "value": -1,  # Invalid value
        "unit": "",   # Empty unit
    }
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(
            "/upsertMeasurement", json=measurement_data, headers=auth_headers
        )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_progress(test_user, auth_headers):
    """Test retrieving user progress."""
    user_id = test_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(
            f"/getProgress?user_id={user_id}", headers=auth_headers
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "data" in data


@pytest.mark.asyncio
async def test_get_cohort_stats(auth_headers):
    """Test retrieving cohort statistics."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(
            "/getCohortStats?metric=weight&window=30d", headers=auth_headers
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "data" in data
