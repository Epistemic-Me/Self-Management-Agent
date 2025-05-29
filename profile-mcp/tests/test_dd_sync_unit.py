"""
Unit tests for DD data synchronization service - Database-free tests.
Tests the DDSyncService class methods and data formatting logic without database dependencies.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
from app.services.dd_sync import DDSyncService
from app.models import DDUserData, DDSyncLog
import json


@pytest.fixture
def dd_sync_service():
    """Create a DDSyncService instance for testing."""
    return DDSyncService()


@pytest.fixture
def mock_user_data():
    """Create a mock DDUserData object with test data."""
    user_data = Mock(spec=DDUserData)
    user_data.user_id = "test-user-123"
    user_data.dontdie_uid = "dd-user-456"
    user_data.sync_status = "success"
    
    # Mock the get/set methods
    measurements_data = [
        {
            "biomarkerName": "Weight",
            "value": 172.0,
            "measurementUnit": "lbs",
            "dateMeasured": "2024-11-10",
            "isSelfReported": True
        }
    ]
    
    capabilities_data = [
        {
            "biomarkerName": "Bench Press",
            "value": 285.0,
            "measurementUnit": "lbs",
            "dateMeasured": "2024-11-10"
        },
        {
            "biomarkerName": "Grip Strength",
            "value": 120.0,
            "measurementUnit": "lbs",
            "dateMeasured": "2024-11-10"
        }
    ]
    
    protocols_data = [
        {
            "name": "Morning Routine",
            "type": "Daily",
            "status": "Active",
            "description": "Daily morning optimization protocol",
            "category": "Health",
            "createdAt": "2024-11-01"
        }
    ]
    
    dd_scores_data = {
        "2025-05-29": {
            "score": {
                "points": 78
            }
        },
        "2025-05-28": {
            "score": {
                "points": 76
            }
        }
    }
    
    # Set up mock return values
    user_data.get_measurements.return_value = measurements_data
    user_data.get_capabilities.return_value = capabilities_data
    user_data.get_protocols.return_value = protocols_data
    user_data.get_dd_scores.return_value = dd_scores_data
    user_data.get_biomarkers.return_value = []  # Empty biomarkers
    
    return user_data


class TestDDSyncServiceFormatting:
    """Test cases for the DDSyncService data formatting methods."""
    
    @pytest.mark.asyncio
    async def test_format_dd_score_data(self, dd_sync_service, mock_user_data):
        """Test formatting DD score data for UI."""
        result = await dd_sync_service.format_data_for_ui(mock_user_data, "dd_score")
        
        assert result["type"] == "dd_score"
        assert result["title"] == "Don't Die Score"
        assert result["data"]["current_score"] == 78
        assert result["data"]["trend"] == "improving"
        assert len(result["data"]["scores"]) == 2
        assert result["data"]["source"] == "Apple Watch"
        assert result["data"]["last_updated"] == "2025-05-29"
    
    @pytest.mark.asyncio
    async def test_format_measurements_data(self, dd_sync_service, mock_user_data):
        """Test formatting measurements data for UI."""
        result = await dd_sync_service.format_data_for_ui(mock_user_data, "measurements")
        
        assert result["type"] == "measurements"
        assert result["title"] == "Physical Measurements"
        assert len(result["data"]["measurements"]) == 1
        
        measurement = result["data"]["measurements"][0]
        assert measurement["type"] == "weight"
        assert measurement["value"] == 172.0
        assert measurement["unit"] == "lbs"
        assert measurement["self_reported"] is True
    
    @pytest.mark.asyncio
    async def test_format_capabilities_data(self, dd_sync_service, mock_user_data):
        """Test formatting capabilities data for UI."""
        result = await dd_sync_service.format_data_for_ui(mock_user_data, "capabilities")
        
        assert result["type"] == "capabilities"
        assert result["title"] == "Physical & Cognitive Capabilities"
        assert len(result["data"]["physical"]) == 2
        assert len(result["data"]["cognitive"]) == 0
        
        bench_press = result["data"]["physical"][0]
        assert bench_press["test"] == "Bench Press"
        assert bench_press["value"] == 285.0
        assert bench_press["unit"] == "lbs"
    
    @pytest.mark.asyncio
    async def test_format_protocols_data(self, dd_sync_service, mock_user_data):
        """Test formatting protocols data for UI."""
        result = await dd_sync_service.format_data_for_ui(mock_user_data, "protocols")
        
        assert result["type"] == "protocols"
        assert result["title"] == "Health Optimization Protocols"
        assert len(result["data"]["active"]) == 1
        assert len(result["data"]["completed"]) == 0
        
        protocol = result["data"]["active"][0]
        assert protocol["name"] == "Morning Routine"
        assert protocol["status"] == "active"
        assert protocol["category"] == "Health"
    
    @pytest.mark.asyncio
    async def test_format_biomarkers_empty_data(self, dd_sync_service, mock_user_data):
        """Test formatting empty biomarkers data for UI."""
        result = await dd_sync_service.format_data_for_ui(mock_user_data, "biomarkers")
        
        assert result["type"] == "biomarkers"
        assert result["title"] == "Lab Results & Biomarkers"
        assert len(result["data"]["labs"]) == 0
        assert "message" in result["data"]
        assert "Don't Die" in result["data"]["message"]
    
    @pytest.mark.asyncio
    async def test_format_health_device_data(self, dd_sync_service, mock_user_data):
        """Test formatting health device data for UI."""
        result = await dd_sync_service.format_data_for_ui(mock_user_data, "health_device")
        
        assert result["type"] == "health_device"
        assert result["title"] == "Health Devices"
        assert len(result["data"]["devices"]) == 1
        
        device = result["data"]["devices"][0]
        assert device["name"] == "Apple Watch"
        assert device["status"] == "connected"
        assert device["type"] == "smartwatch"
    
    @pytest.mark.asyncio
    async def test_format_unknown_bucket_code(self, dd_sync_service, mock_user_data):
        """Test formatting data for unknown bucket code."""
        result = await dd_sync_service.format_data_for_ui(mock_user_data, "unknown_bucket")
        
        assert result["type"] == "unknown_bucket"
        assert result["title"] == "Unknown Bucket"
        assert "message" in result["data"]
        assert "No data available" in result["data"]["message"]
    
    @pytest.mark.asyncio
    async def test_format_dd_score_declining_trend(self, dd_sync_service):
        """Test DD score formatting with declining trend."""
        mock_data = Mock(spec=DDUserData)
        mock_data.get_dd_scores.return_value = {
            "2025-05-29": {"score": {"points": 75}},
            "2025-05-28": {"score": {"points": 78}}
        }
        
        result = await dd_sync_service.format_data_for_ui(mock_data, "dd_score")
        
        assert result["data"]["current_score"] == 75
        assert result["data"]["trend"] == "declining"
    
    @pytest.mark.asyncio
    async def test_format_dd_score_stable_trend(self, dd_sync_service):
        """Test DD score formatting with stable trend (single data point)."""
        mock_data = Mock(spec=DDUserData)
        mock_data.get_dd_scores.return_value = {
            "2025-05-29": {"score": {"points": 80}}
        }
        
        result = await dd_sync_service.format_data_for_ui(mock_data, "dd_score")
        
        assert result["data"]["current_score"] == 80
        assert result["data"]["trend"] == "stable"
    
    @pytest.mark.asyncio
    async def test_format_dd_score_no_data(self, dd_sync_service):
        """Test DD score formatting with no data."""
        mock_data = Mock(spec=DDUserData)
        mock_data.get_dd_scores.return_value = {}
        
        result = await dd_sync_service.format_data_for_ui(mock_data, "dd_score")
        
        # Should still return default structure
        assert result["type"] == "dd_score"
        assert result["title"] == "Don't Die Score"


class TestDDSyncServiceAPIRequests:
    """Test cases for the DDSyncService API request methods."""
    
    @pytest.mark.asyncio
    async def test_make_dd_request_success(self, dd_sync_service):
        """Test successful DD-MCP API request."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": "test"}
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            result = await dd_sync_service._make_dd_request("testEndpoint")
            
            assert result == {"data": "test"}
    
    @pytest.mark.asyncio
    async def test_make_dd_request_auth_failure_fallback(self, dd_sync_service):
        """Test DD-MCP API request with auth failure and successful fallback."""
        # Set up mock responses
        auth_response = Mock()
        auth_response.status_code = 401
        
        fallback_response = Mock()
        fallback_response.status_code = 200
        fallback_response.json.return_value = {"data": "fallback_success"}
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_get = AsyncMock(side_effect=[auth_response, fallback_response])
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            result = await dd_sync_service._make_dd_request("testEndpoint")
            
            assert result == {"data": "fallback_success"}
            assert mock_get.call_count == 2
    
    @pytest.mark.asyncio
    async def test_make_dd_request_failure(self, dd_sync_service):
        """Test DD-MCP API request failure."""
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
            
            result = await dd_sync_service._make_dd_request("testEndpoint")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_make_dd_request_with_params(self, dd_sync_service):
        """Test DD-MCP API request with parameters."""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": "with_params"}
        
        with patch("httpx.AsyncClient") as mock_client:
            mock_get = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value.get = mock_get
            
            result = await dd_sync_service._make_dd_request("testEndpoint", {"param1": "value1"})
            
            assert result == {"data": "with_params"}
            # Verify that params were passed
            mock_get.assert_called_once()
            call_args = mock_get.call_args
            assert call_args[1]["params"] == {"param1": "value1"}


class TestDDUserDataModelLogic:
    """Test cases for the DDUserData model logic (without database)."""
    
    def test_measurements_json_methods(self):
        """Test measurements JSON serialization/deserialization logic."""
        # Create a real DDUserData instance (without saving to DB)
        user_data = DDUserData(user_id="test", dontdie_uid="test")
        
        test_measurements = [
            {"name": "Weight", "value": 70.0, "unit": "kg"}
        ]
        
        user_data.set_measurements(test_measurements)
        assert user_data.measurements is not None
        
        retrieved_measurements = user_data.get_measurements()
        assert retrieved_measurements == test_measurements
    
    def test_capabilities_json_methods(self):
        """Test capabilities JSON serialization/deserialization logic."""
        user_data = DDUserData(user_id="test", dontdie_uid="test")
        
        test_capabilities = [
            {"test": "Push-ups", "value": 50, "unit": "reps"}
        ]
        
        user_data.set_capabilities(test_capabilities)
        assert user_data.capabilities is not None
        
        retrieved_capabilities = user_data.get_capabilities()
        assert retrieved_capabilities == test_capabilities
    
    def test_dd_scores_json_methods(self):
        """Test DD scores JSON serialization/deserialization logic."""
        user_data = DDUserData(user_id="test", dontdie_uid="test")
        
        test_scores = {
            "2024-11-10": {"score": {"points": 85}},
            "2024-11-09": {"score": {"points": 82}}
        }
        
        user_data.set_dd_scores(test_scores)
        assert user_data.dd_scores is not None
        
        retrieved_scores = user_data.get_dd_scores()
        assert retrieved_scores == test_scores
    
    def test_empty_data_handling(self):
        """Test handling of empty/None data."""
        user_data = DDUserData(user_id="test", dontdie_uid="test")
        
        # Test empty lists/dicts
        assert user_data.get_measurements() == []
        assert user_data.get_capabilities() == []
        assert user_data.get_biomarkers() == []
        assert user_data.get_protocols() == []
        assert user_data.get_dd_scores() == {}
    
    def test_json_decode_error_handling(self):
        """Test handling of corrupted JSON data."""
        user_data = DDUserData(user_id="test", dontdie_uid="test")
        
        # Manually set invalid JSON
        user_data.measurements = "invalid json{"
        user_data.dd_scores = "not json at all"
        
        # Should return empty containers without raising exceptions
        assert user_data.get_measurements() == []
        assert user_data.get_dd_scores() == {}
    
    def test_updated_at_auto_update(self):
        """Test that updated_at is automatically set when data changes."""
        user_data = DDUserData(user_id="test", dontdie_uid="test")
        original_updated_at = user_data.updated_at
        
        # Small delay to ensure timestamp difference
        import time
        time.sleep(0.01)
        
        user_data.set_measurements([{"test": "data"}])
        
        assert user_data.updated_at > original_updated_at
    
    def test_sync_status_defaults(self):
        """Test that sync status defaults are set correctly."""
        user_data = DDUserData(user_id="test", dontdie_uid="test")
        
        assert user_data.sync_status == "pending"
        assert user_data.sync_error is None
        assert user_data.created_at is not None
        assert user_data.updated_at is not None
        assert user_data.last_synced is not None


class TestDDSyncLogModel:
    """Test cases for the DDSyncLog model logic (without database)."""
    
    def test_sync_log_creation(self):
        """Test DDSyncLog model creation with required fields."""
        sync_log = DDSyncLog(
            user_id="test-user",
            sync_type="full",
            status="started",
            records_synced=0
        )
        
        assert sync_log.user_id == "test-user"
        assert sync_log.sync_type == "full"
        assert sync_log.status == "started"
        assert sync_log.records_synced == 0
        assert sync_log.created_at is not None
    
    def test_sync_log_optional_fields(self):
        """Test DDSyncLog with optional fields."""
        sync_log = DDSyncLog(
            user_id="test-user",
            sync_type="incremental",
            status="success",
            records_synced=5,
            endpoint="getMeasurements",
            duration_ms=1500
        )
        
        assert sync_log.endpoint == "getMeasurements"
        assert sync_log.duration_ms == 1500
        assert sync_log.error_message is None
    
    def test_sync_log_error_case(self):
        """Test DDSyncLog for error scenarios."""
        sync_log = DDSyncLog(
            user_id="test-user",
            sync_type="full",
            status="error",
            records_synced=0,
            error_message="Connection timeout",
            duration_ms=5000
        )
        
        assert sync_log.status == "error"
        assert sync_log.error_message == "Connection timeout"
        assert sync_log.records_synced == 0 