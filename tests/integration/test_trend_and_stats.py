import pytest
import httpx
from datetime import datetime, timedelta


@pytest.mark.integration
@pytest.mark.asyncio
async def test_insert_dd_scores_then_trend(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    user_id: str,
    reset_state,
    get_row_helper
):
    """Test inserting DD score measurements and analyzing trends."""
    # Insert 10 DD score measurements over 10 days
    base_date = datetime.now() - timedelta(days=9)
    
    for i in range(10):
        measurement_date = base_date + timedelta(days=i)
        dd_score = 75.0 + (i * 2.5)  # Increasing trend: 75, 77.5, 80, etc.
        
        response = await async_client.post(
            f"{service_urls['profile_mcp']}/upsertMeasurement",
            headers=auth_headers,
            json={
                "type": "dd_score",
                "value": dd_score,
                "unit": "score",
                "captured_at": measurement_date.isoformat()
            }
        )
        
        assert response.status_code == 200
    
    # Verify measurements were inserted
    measurement_rows = await get_row_helper("measurements", "type = $1", ["dd_score"])
    assert measurement_rows is not None
    
    # Get progress trend for dd_score over 10 days
    trend_response = await async_client.get(
        f"{service_urls['profile_mcp']}/getProgressTrend",
        headers=auth_headers,
        params={
            "metric": "dd_score",
            "days": 10
        }
    )
    
    assert trend_response.status_code == 200
    trend_data = trend_response.json()
    
    # Verify trend analysis
    assert "slope" in trend_data
    assert "sparkline" in trend_data
    assert "r_squared" in trend_data
    
    # Should have positive slope (increasing trend)
    assert trend_data["slope"] > 0
    
    # Sparkline should have 10 data points
    assert len(trend_data["sparkline"]) == 10
    
    # R-squared should be high for this linear trend
    assert trend_data["r_squared"] > 0.9


@pytest.mark.integration
@pytest.mark.asyncio
async def test_cohort_stats_two_users(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    user_id: str,
    reset_state,
    get_row_helper,
    redis_client
):
    """Test cohort statistics with multiple users."""
    # Set up second user
    user_2_id = "user-0002"
    user_2_token = "TEST_TOKEN_2"
    
    # Add second user token to Redis
    await redis_client.set(f"token:{user_2_token}", user_2_id, ex=86400)
    
    user_2_headers = {"Authorization": f"Bearer {user_2_token}"}
    
    # Insert weight measurements for user 1
    await async_client.post(
        f"{service_urls['profile_mcp']}/upsertMeasurement",
        headers=auth_headers,
        json={
            "type": "weight",
            "value": 70.5,
            "unit": "kg",
            "captured_at": datetime.now().isoformat()
        }
    )
    
    await async_client.post(
        f"{service_urls['profile_mcp']}/upsertMeasurement",
        headers=auth_headers,
        json={
            "type": "weight",
            "value": 71.0,
            "unit": "kg",
            "captured_at": (datetime.now() - timedelta(days=1)).isoformat()
        }
    )
    
    # Insert weight measurements for user 2
    await async_client.post(
        f"{service_urls['profile_mcp']}/upsertMeasurement",
        headers=user_2_headers,
        json={
            "type": "weight",
            "value": 65.0,
            "unit": "kg",
            "captured_at": datetime.now().isoformat()
        }
    )
    
    await async_client.post(
        f"{service_urls['profile_mcp']}/upsertMeasurement",
        headers=user_2_headers,
        json={
            "type": "weight",
            "value": 64.5,
            "unit": "kg",
            "captured_at": (datetime.now() - timedelta(days=1)).isoformat()
        }
    )
    
    # Get cohort stats for weight
    stats_response = await async_client.get(
        f"{service_urls['profile_mcp']}/getCohortStats",
        headers=auth_headers,
        params={"metric": "weight"}
    )
    
    assert stats_response.status_code == 200
    stats_data = stats_response.json()
    
    # Verify cohort statistics structure
    assert "avg" in stats_data
    assert "p50" in stats_data  # median
    assert "count" in stats_data
    assert "std" in stats_data
    
    # Should have data from both users
    assert stats_data["count"] >= 4  # At least 4 measurements total
    
    # Average should be reasonable (between user values)
    assert 64.0 <= stats_data["avg"] <= 72.0
    
    # Median should be present
    assert stats_data["p50"] > 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_trend_analysis_edge_cases(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    user_id: str,
    reset_state,
    get_row_helper
):
    """Test trend analysis with edge cases like flat trends and insufficient data."""
    # Test with flat trend (no change)
    base_date = datetime.now() - timedelta(days=4)
    flat_value = 80.0
    
    for i in range(5):
        measurement_date = base_date + timedelta(days=i)
        
        response = await async_client.post(
            f"{service_urls['profile_mcp']}/upsertMeasurement",
            headers=auth_headers,
            json={
                "type": "blood_pressure_systolic",
                "value": flat_value,
                "unit": "mmHg",
                "captured_at": measurement_date.isoformat()
            }
        )
        
        assert response.status_code == 200
    
    # Get trend for flat data
    trend_response = await async_client.get(
        f"{service_urls['profile_mcp']}/getProgressTrend",
        headers=auth_headers,
        params={
            "metric": "blood_pressure_systolic",
            "days": 5
        }
    )
    
    assert trend_response.status_code == 200
    trend_data = trend_response.json()
    
    # Flat trend should have near-zero slope
    assert abs(trend_data["slope"]) < 0.1
    
    # Should still have sparkline data
    assert len(trend_data["sparkline"]) == 5
    
    # Test with insufficient data (should handle gracefully)
    trend_response_insufficient = await async_client.get(
        f"{service_urls['profile_mcp']}/getProgressTrend",
        headers=auth_headers,
        params={
            "metric": "nonexistent_metric",
            "days": 10
        }
    )
    
    # Should handle missing data gracefully
    assert trend_response_insufficient.status_code in [200, 404]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_measurement_types_variety(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    user_id: str,
    reset_state,
    get_row_helper
):
    """Test various measurement types and their storage."""
    measurement_types = [
        {"type": "heart_rate", "value": 72.0, "unit": "bpm"},
        {"type": "steps", "value": 8500.0, "unit": "steps"},
        {"type": "sleep_hours", "value": 7.5, "unit": "hours"},
        {"type": "body_fat_percentage", "value": 15.2, "unit": "%"},
        {"type": "vo2_max", "value": 45.8, "unit": "ml/kg/min"}
    ]
    
    # Insert various measurement types
    for measurement in measurement_types:
        response = await async_client.post(
            f"{service_urls['profile_mcp']}/upsertMeasurement",
            headers=auth_headers,
            json={
                **measurement,
                "captured_at": datetime.now().isoformat()
            }
        )
        
        assert response.status_code == 200
    
    # Verify all measurements were stored
    for measurement in measurement_types:
        row = await get_row_helper("measurements", "type = $1", [measurement["type"]])
        assert row is not None
        assert row["value"] == measurement["value"]
        assert row["unit"] == measurement["unit"]
        assert row["user_id"] == user_id 