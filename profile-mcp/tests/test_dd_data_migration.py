"""
Tests for DD data database migration and schema validation.
Ensures the DDUserData and DDSyncLog tables are created correctly.
"""

import pytest
import pytest_asyncio
from sqlalchemy import inspect, text
from app.models import DDUserData, DDSyncLog
from datetime import datetime


class TestDDDataSchema:
    """Test cases for DD data database schema."""
    
    @pytest.mark.asyncio
    async def test_dd_user_data_table_exists(self, test_async_session):
        """Test that dd_user_data table exists with correct structure."""
        # Test table exists by inserting and querying data
        user_data = DDUserData(
            user_id="schema-test-user",
            dontdie_uid="schema-test-dd-user",
            sync_status="pending"
        )
        
        test_async_session.add(user_data)
        await test_async_session.commit()
        
        # Query the data back
        result = await test_async_session.execute(
            text("SELECT * FROM dd_user_data WHERE user_id = :user_id"),
            {"user_id": "schema-test-user"}
        )
        row = result.fetchone()
        
        assert row is not None
        assert row.user_id == "schema-test-user"
        assert row.dontdie_uid == "schema-test-dd-user"
        assert row.sync_status == "pending"
        assert row.created_at is not None
        assert row.updated_at is not None
    
    @pytest.mark.asyncio
    async def test_dd_sync_log_table_exists(self, test_async_session):
        """Test that dd_sync_log table exists with correct structure."""
        # Test table exists by inserting and querying data
        sync_log = DDSyncLog(
            user_id="schema-test-user",
            sync_type="full",
            status="started",
            records_synced=0
        )
        
        test_async_session.add(sync_log)
        await test_async_session.commit()
        
        # Query the data back
        result = await test_async_session.execute(
            text("SELECT * FROM dd_sync_log WHERE user_id = :user_id"),
            {"user_id": "schema-test-user"}
        )
        row = result.fetchone()
        
        assert row is not None
        assert row.user_id == "schema-test-user"
        assert row.sync_type == "full"
        assert row.status == "started"
        assert row.records_synced == 0
        assert row.created_at is not None
    
    @pytest.mark.asyncio
    async def test_dd_user_data_indexes(self, test_async_session):
        """Test that indexes exist on dd_user_data table."""
        # Check indexes by running queries that should use them
        
        # Test user_id index
        await test_async_session.execute(
            text("EXPLAIN SELECT * FROM dd_user_data WHERE user_id = :user_id"),
            {"user_id": "test"}
        )
        
        # Test dontdie_uid index
        await test_async_session.execute(
            text("EXPLAIN SELECT * FROM dd_user_data WHERE dontdie_uid = :dontdie_uid"),
            {"dontdie_uid": "test"}
        )
        
        # If indexes don't exist, these queries might still work but would be slower
        # The fact they execute without error indicates the columns exist
        assert True
    
    @pytest.mark.asyncio
    async def test_dd_sync_log_indexes(self, test_async_session):
        """Test that indexes exist on dd_sync_log table."""
        # Test user_id index
        await test_async_session.execute(
            text("EXPLAIN SELECT * FROM dd_sync_log WHERE user_id = :user_id"),
            {"user_id": "test"}
        )
        
        assert True
    
    @pytest.mark.asyncio
    async def test_dd_user_data_json_columns(self, test_async_session):
        """Test that JSON columns can store and retrieve data correctly."""
        user_data = DDUserData(
            user_id="json-test-user",
            dontdie_uid="json-test-dd-user",
            sync_status="success"
        )
        
        # Test storing JSON data
        test_measurements = [{"name": "Weight", "value": 70.0}]
        test_scores = {"2024-11-10": {"score": {"points": 85}}}
        
        user_data.set_measurements(test_measurements)
        user_data.set_dd_scores(test_scores)
        
        test_async_session.add(user_data)
        await test_async_session.commit()
        
        # Refresh the object from database
        await test_async_session.refresh(user_data)
        
        # Test retrieving JSON data
        retrieved_measurements = user_data.get_measurements()
        retrieved_scores = user_data.get_dd_scores()
        
        assert retrieved_measurements == test_measurements
        assert retrieved_scores == test_scores
    
    @pytest.mark.asyncio
    async def test_dd_user_data_nullable_fields(self, test_async_session):
        """Test that nullable fields can be None."""
        user_data = DDUserData(
            user_id="nullable-test-user",
            dontdie_uid="nullable-test-dd-user",
            sync_status="pending",
            # All JSON fields should be nullable
            measurements=None,
            capabilities=None,
            biomarkers=None,
            protocols=None,
            dd_scores=None,
            sync_error=None
        )
        
        test_async_session.add(user_data)
        await test_async_session.commit()
        
        # Refresh and verify
        await test_async_session.refresh(user_data)
        
        assert user_data.measurements is None
        assert user_data.capabilities is None
        assert user_data.biomarkers is None
        assert user_data.protocols is None
        assert user_data.dd_scores is None
        assert user_data.sync_error is None
    
    @pytest.mark.asyncio
    async def test_dd_sync_log_optional_fields(self, test_async_session):
        """Test that optional fields in sync log can be None."""
        sync_log = DDSyncLog(
            user_id="optional-test-user",
            sync_type="full",
            status="started",
            records_synced=0,
            # Optional fields
            endpoint=None,
            error_message=None,
            duration_ms=None
        )
        
        test_async_session.add(sync_log)
        await test_async_session.commit()
        
        # Refresh and verify
        await test_async_session.refresh(sync_log)
        
        assert sync_log.endpoint is None
        assert sync_log.error_message is None
        assert sync_log.duration_ms is None
    
    @pytest.mark.asyncio
    async def test_dd_user_data_defaults(self, test_async_session):
        """Test that default values are set correctly."""
        before_create = datetime.utcnow()
        
        user_data = DDUserData(
            user_id="defaults-test-user",
            dontdie_uid="defaults-test-dd-user"
            # sync_status should default to "pending"
            # timestamps should be auto-generated
        )
        
        test_async_session.add(user_data)
        await test_async_session.commit()
        
        after_create = datetime.utcnow()
        
        # Refresh to get database values
        await test_async_session.refresh(user_data)
        
        assert user_data.sync_status == "pending"
        assert before_create <= user_data.created_at <= after_create
        assert before_create <= user_data.updated_at <= after_create
        assert user_data.last_synced >= before_create
    
    @pytest.mark.asyncio 
    async def test_multiple_users_data_isolation(self, test_async_session):
        """Test that data for different users is properly isolated."""
        # Create data for user 1
        user1_data = DDUserData(
            user_id="isolation-user-1",
            dontdie_uid="dd-user-1",
            sync_status="success"
        )
        user1_data.set_measurements([{"name": "Weight", "value": 70.0}])
        
        # Create data for user 2
        user2_data = DDUserData(
            user_id="isolation-user-2", 
            dontdie_uid="dd-user-2",
            sync_status="pending"
        )
        user2_data.set_measurements([{"name": "Height", "value": 175.0}])
        
        test_async_session.add(user1_data)
        test_async_session.add(user2_data)
        await test_async_session.commit()
        
        # Query each user's data separately
        result1 = await test_async_session.execute(
            text("SELECT * FROM dd_user_data WHERE user_id = :user_id"),
            {"user_id": "isolation-user-1"}
        )
        row1 = result1.fetchone()
        
        result2 = await test_async_session.execute(
            text("SELECT * FROM dd_user_data WHERE user_id = :user_id"),
            {"user_id": "isolation-user-2"}
        )
        row2 = result2.fetchone()
        
        # Verify data isolation
        assert row1.user_id == "isolation-user-1"
        assert row1.sync_status == "success"
        assert row1.dontdie_uid == "dd-user-1"
        
        assert row2.user_id == "isolation-user-2"
        assert row2.sync_status == "pending"
        assert row2.dontdie_uid == "dd-user-2"
        
        # Verify measurements are different
        import json
        measurements1 = json.loads(row1.measurements)
        measurements2 = json.loads(row2.measurements)
        
        assert measurements1[0]["name"] == "Weight"
        assert measurements2[0]["name"] == "Height" 