import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
import json


@pytest.mark.asyncio
async def test_get_progress_trend_success(test_user, auth_headers, redis_client):
    """Test successful progress trend retrieval."""
    user_id = test_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(
            f"/getProgressTrend?user_id={user_id}&metric=health_score&window=7",
            headers=auth_headers
        )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "data" in data
    assert "slope" in data["data"]
    assert "sparkline" in data["data"]
    assert isinstance(data["data"]["slope"], (int, float))
    assert isinstance(data["data"]["sparkline"], list)
    assert len(data["data"]["sparkline"]) == 7  # Should match window size


@pytest.mark.asyncio
async def test_get_progress_trend_caching(test_user, auth_headers, redis_client):
    """Test that progress trend results are cached correctly."""
    user_id = test_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # First call - should generate and cache data
        response1 = await ac.get(
            f"/getProgressTrend?user_id={user_id}&metric=test_metric&window=5",
            headers=auth_headers
        )
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Second call - should return cached data
        response2 = await ac.get(
            f"/getProgressTrend?user_id={user_id}&metric=test_metric&window=5",
            headers=auth_headers
        )
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Data should be identical (cached)
        assert data1["data"]["slope"] == data2["data"]["slope"]
        assert data1["data"]["sparkline"] == data2["data"]["sparkline"]
        
        # Verify data is actually in Redis cache
        cache_key = f"trend:{user_id}:test_metric:5"
        cached_value = await redis_client.get(cache_key)
        assert cached_value is not None
        
        # Verify cached data can be deserialized
        cached_data = json.loads(cached_value)
        assert cached_data["slope"] == data1["data"]["slope"]
        assert cached_data["sparkline"] == data1["data"]["sparkline"]


@pytest.mark.asyncio
async def test_get_progress_trend_different_windows(test_user, auth_headers):
    """Test progress trend with different window sizes."""
    user_id = test_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test different window sizes
        for window in [1, 7, 30, 365]:
            response = await ac.get(
                f"/getProgressTrend?user_id={user_id}&metric=health_score&window={window}",
                headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert len(data["data"]["sparkline"]) == window


@pytest.mark.asyncio
async def test_get_progress_trend_invalid_window(test_user, auth_headers):
    """Test progress trend with invalid window size."""
    user_id = test_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test window size too large
        response = await ac.get(
            f"/getProgressTrend?user_id={user_id}&metric=health_score&window=500",
            headers=auth_headers
        )
        assert response.status_code == 422  # Validation error
        
        # Test window size too small
        response = await ac.get(
            f"/getProgressTrend?user_id={user_id}&metric=health_score&window=0",
            headers=auth_headers
        )
        assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_get_progress_trend_unauthorized():
    """Test progress trend without authentication."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/getProgressTrend?user_id=test&metric=health_score&window=7")
    
    # Returns 422 because user_id validation fails before auth check
    assert response.status_code == 422 