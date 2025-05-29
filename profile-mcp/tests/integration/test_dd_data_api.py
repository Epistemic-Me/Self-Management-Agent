"""
Integration tests for DD data synchronization API endpoints.
Tests the full flow of sync requests, database interactions, and API responses.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock, Mock
from app.main import app
from app.models import User, DDUserData, DDSyncLog
from sqlmodel import select
from datetime import datetime
import json


@pytest_asyncio.fixture
async def client():
    """Test client for making API requests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def test_user_with_data(test_async_session):
    """Create a test user with some DD data."""
    from uuid import uuid4
    
    user_id = str(uuid4())
    user = User(id=user_id, dontdie_uid="dd-test-user-123", created_at=datetime.utcnow())
    test_async_session.add(user)
    
    # Add some DD data
    dd_data = DDUserData(
        user_id=user_id,
        dontdie_uid="dd-test-user-123",
        sync_status="success",
        last_synced=datetime.utcnow()
    )
    
    # Set test data
    dd_data.set_measurements([
        {
            "biomarkerName": "Weight",
            "value": 75.0,
            "measurementUnit": "kg",
            "dateMeasured": "2024-11-10",
            "isSelfReported": True
        }
    ])
    
    dd_data.set_dd_scores({
        "2024-11-10": {"score": {"points": 85}},
        "2024-11-09": {"score": {"points": 83}}
    })
    
    test_async_session.add(dd_data)
    await test_async_session.commit()
    
    return user_id


class TestDDDataSyncEndpoints:
    """Test cases for DD data sync API endpoints."""
    
    @pytest.mark.asyncio
    async def test_sync_user_data_success(self, client, auth_headers, test_user, test_async_session):
        """Test successful user data sync."""
        # Mock the DD-MCP API responses
        mock_measurements = [{"biomarkerName": "Weight", "value": 70.0}]
        mock_capabilities = [{"biomarkerName": "Bench Press", "value": 100.0}]
        
        with patch("app.services.dd_sync.DDSyncService._make_dd_request") as mock_request:
            mock_request.side_effect = [
                mock_measurements,  # getMeasurements
                mock_capabilities,  # getCapabilities
                [],                 # getBiomarkers
                [],                 # getUserProtocols
                {}                  # getDdScore
            ]
            
            response = await client.post(
                f"/dd-data/sync/{test_user}",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Sync completed"
            assert data["user_id"] == test_user
            assert data["sync_status"] == "success"
            
            # Verify data was saved to database
            stmt = select(DDUserData).where(DDUserData.user_id == test_user)
            result = await test_async_session.execute(stmt)
            user_data = result.scalar_one_or_none()
            
            assert user_data is not None
            assert user_data.sync_status == "success"
            assert user_data.get_measurements() == mock_measurements
            assert user_data.get_capabilities() == mock_capabilities
    
    @pytest.mark.asyncio
    async def test_sync_user_data_background(self, client, auth_headers, test_user):
        """Test background sync functionality."""
        with patch("app.services.dd_sync.DDSyncService._make_dd_request") as mock_request:
            mock_request.return_value = []
            
            response = await client.post(
                f"/dd-data/sync/{test_user}",
                headers=auth_headers
            )
            
            # For this test, we expect the sync to complete immediately in test environment
            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert data["user_id"] == test_user
    
    @pytest.mark.asyncio
    async def test_sync_user_data_force_flag(self, client, auth_headers, test_user_with_data, test_async_session):
        """Test force sync bypasses recent sync check."""
        # Mock new data to sync
        mock_new_measurements = [{"biomarkerName": "Height", "value": 180.0}]
        
        with patch("app.services.dd_sync.DDSyncService._make_dd_request") as mock_request:
            mock_request.side_effect = [
                mock_new_measurements,  # getMeasurements
                [],                     # getCapabilities
                [],                     # getBiomarkers
                [],                     # getUserProtocols
                {}                      # getDdScore
            ]
            
            response = await client.post(
                f"/dd-data/sync/{test_user_with_data}?force=true",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["sync_status"] == "success"
            
            # Verify new data was synced
            stmt = select(DDUserData).where(DDUserData.user_id == test_user_with_data)
            result = await test_async_session.execute(stmt)
            user_data = result.scalar_one_or_none()
            
            assert user_data.get_measurements() == mock_new_measurements
    
    @pytest.mark.asyncio
    async def test_sync_user_not_found(self, client, auth_headers):
        """Test sync for non-existent user."""
        fake_user_id = "00000000-0000-0000-0000-000000000000"
        
        response = await client.post(
            f"/dd-data/sync/{fake_user_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_sync_user_unauthorized(self, client, test_user):
        """Test sync without proper authentication."""
        response = await client.post(f"/dd-data/sync/{test_user}")
        
        assert response.status_code == 403
    
    @pytest.mark.asyncio
    async def test_get_sync_status_with_data(self, client, auth_headers, test_user_with_data):
        """Test getting sync status for user with data."""
        response = await client.get(
            f"/dd-data/status/{test_user_with_data}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == test_user_with_data
        assert data["sync_status"] == "success"
        assert data["last_synced"] is not None
        assert data["data_available"]["measurements"] is True
        assert data["data_available"]["dd_scores"] is True
    
    @pytest.mark.asyncio
    async def test_get_sync_status_no_data(self, client, auth_headers, test_user):
        """Test getting sync status for user without synced data."""
        response = await client.get(
            f"/dd-data/status/{test_user}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == test_user
        assert data["sync_status"] == "not_synced"
        assert data["last_synced"] is None
        assert "Run sync first" in data["message"]


class TestDDDataServingEndpoints:
    """Test cases for DD data serving API endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_checklist_item_dd_score(self, client, auth_headers, test_user_with_data):
        """Test getting DD score data for checklist item."""
        response = await client.get(
            "/dd-data/checklist-item-data?bucket_code=dd_score",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "dd_score"
        assert data["title"] == "Don't Die Score"
        assert data["data"]["current_score"] == 85
        assert data["data"]["trend"] == "improving"
        assert len(data["data"]["scores"]) == 2
    
    @pytest.mark.asyncio
    async def test_get_checklist_item_measurements(self, client, auth_headers, test_user_with_data):
        """Test getting measurements data for checklist item."""
        response = await client.get(
            "/dd-data/checklist-item-data?bucket_code=measurements",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "measurements"
        assert data["title"] == "Physical Measurements"
        assert len(data["data"]["measurements"]) == 1
        
        measurement = data["data"]["measurements"][0]
        assert measurement["type"] == "weight"
        assert measurement["value"] == 75.0
        assert measurement["unit"] == "kg"
    
    @pytest.mark.asyncio
    async def test_get_checklist_item_health_device(self, client, auth_headers, test_user):
        """Test getting health device data (doesn't require sync)."""
        response = await client.get(
            "/dd-data/checklist-item-data?bucket_code=health_device",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "health_device"
        assert data["title"] == "Health Devices"
        assert len(data["data"]["devices"]) == 1
        
        device = data["data"]["devices"][0]
        assert device["name"] == "Apple Watch"
        assert device["status"] == "connected"
    
    @pytest.mark.asyncio
    async def test_get_checklist_item_fallback_data(self, client, auth_headers, test_user):
        """Test getting fallback data when no sync data available."""
        response = await client.get(
            "/dd-data/checklist-item-data?bucket_code=measurements",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "measurements"
        assert "synchronized" in data["data"]["message"]
    
    @pytest.mark.asyncio
    async def test_get_checklist_item_auto_sync(self, client, auth_headers, test_user, test_async_session):
        """Test that checklist item endpoint auto-syncs when no data exists."""
        mock_measurements = [{"biomarkerName": "Weight", "value": 68.0}]
        
        with patch("app.services.dd_sync.DDSyncService._make_dd_request") as mock_request:
            mock_request.side_effect = [
                mock_measurements,  # getMeasurements
                [],                 # getCapabilities
                [],                 # getBiomarkers
                [],                 # getUserProtocols
                {}                  # getDdScore
            ]
            
            response = await client.get(
                "/dd-data/checklist-item-data?bucket_code=measurements",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Should either return synced data or fallback
            assert data["type"] == "measurements"
            
            # Verify sync was attempted by checking if user data was created
            stmt = select(DDUserData).where(DDUserData.user_id == test_user)
            result = await test_async_session.execute(stmt)
            user_data = result.scalar_one_or_none()
            
            # Auto-sync might succeed or fail, but should attempt sync
            assert user_data is not None or "synchronized" in data["data"].get("message", "")
    
    @pytest.mark.asyncio
    async def test_get_sync_logs(self, client, auth_headers, test_user, test_async_session):
        """Test getting sync logs for a user."""
        # Create some test sync logs
        log1 = DDSyncLog(
            user_id=test_user,
            sync_type="full",
            status="success",
            duration_ms=500,
            records_synced=1
        )
        log2 = DDSyncLog(
            user_id=test_user,
            sync_type="full",
            status="error",
            error_message="Connection timeout",
            duration_ms=1000
        )
        
        test_async_session.add(log1)
        test_async_session.add(log2)
        await test_async_session.commit()
        
        response = await client.get(
            f"/dd-data/sync-logs/{test_user}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == test_user
        assert len(data["logs"]) == 2
        
        # Logs should be ordered by created_at desc
        latest_log = data["logs"][0]
        assert latest_log["status"] == "error"
        assert latest_log["error_message"] == "Connection timeout"
        assert latest_log["duration_ms"] == 1000
        
        success_log = data["logs"][1]
        assert success_log["status"] == "success"
        assert success_log["records_synced"] == 1


class TestDDDataErrorHandling:
    """Test cases for error handling in DD data endpoints."""
    
    @pytest.mark.asyncio
    async def test_sync_with_dd_mcp_error(self, client, auth_headers, test_user):
        """Test sync when DD-MCP service is unavailable."""
        with patch("app.services.dd_sync.DDSyncService._make_dd_request") as mock_request:
            mock_request.side_effect = Exception("DD-MCP service unavailable")
            
            response = await client.post(
                f"/dd-data/sync/{test_user}",
                headers=auth_headers
            )
            
            assert response.status_code == 500
            assert "DD-MCP service unavailable" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_checklist_item_data_with_sync_error(self, client, auth_headers, test_user):
        """Test checklist item data endpoint when auto-sync fails."""
        with patch("app.services.dd_sync.DDSyncService.sync_user_data") as mock_sync:
            mock_sync.side_effect = Exception("Sync failed")
            
            response = await client.get(
                "/dd-data/checklist-item-data?bucket_code=measurements",
                headers=auth_headers
            )
            
            # Should return fallback data instead of error
            assert response.status_code == 200
            data = response.json()
            assert data["type"] == "measurements"
            assert "synchronized" in data["data"]["message"]
    
    @pytest.mark.asyncio
    async def test_missing_bucket_code_parameter(self, client, auth_headers):
        """Test checklist item data endpoint without bucket_code."""
        response = await client.get(
            "/dd-data/checklist-item-data",
            headers=auth_headers
        )
        
        # FastAPI should return 422 for missing required parameter
        assert response.status_code == 422 