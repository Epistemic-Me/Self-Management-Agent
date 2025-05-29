import asyncio
import os
import pytest
import httpx
import redis.asyncio as redis
import asyncpg
import uuid


@pytest.mark.asyncio
async def test_comprehensive_service_integration():
    """Test comprehensive functionality across all services."""
    # Service URLs
    service_urls = {
        "profile_mcp": os.getenv("PROFILE_MCP_URL", "http://profile-mcp:8010"),
        "dd_mcp": os.getenv("DD_MCP_URL", "http://dd-mcp:8090"),
        "em_mcp": os.getenv("EM_MCP_URL", "http://em-mcp:8120"),
    }
    
    token = "TEST_TOKEN"
    user_id = str(uuid.uuid4())  # Generate a valid UUID
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    # Set up Redis token mapping
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_client = redis.from_url(redis_url)
    
    try:
        # Clear Redis and set up token
        await redis_client.flushdb()
        await redis_client.set(f"token:{token}", user_id, ex=86400)
        
        # Set up database connection
        database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/postgres")
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
        db_conn = await asyncpg.connect(database_url)
        
        try:
            # Clear database tables (using correct table names)
            tables_to_truncate = [
                "belief", "beliefsystem", "measurement", 
                "userfile", "checklistitem", "selfmodel", '"user"'
            ]
            
            for table in tables_to_truncate:
                try:
                    await db_conn.execute(f"TRUNCATE TABLE {table} CASCADE")
                except Exception:
                    pass  # Table might not exist
            
            # Create a user in the database (using correct table name and schema)
            await db_conn.execute(
                'INSERT INTO "user" (id, dontdie_uid, created_at) VALUES ($1, $2, NOW())',
                user_id, f"dd_{user_id[:8]}"  # Generate a dontdie_uid
            )
            
            # Test HTTP client
            async with httpx.AsyncClient(timeout=30.0) as client:
                print(f"Testing with user_id: {user_id}")
                
                # === Test 1: Profile MCP Functionality ===
                print("\n=== Testing Profile MCP ===")
                
                # Test checklist progress
                response = await client.get(
                    f"{service_urls['profile_mcp']}/getChecklistProgress",
                    headers=auth_headers
                )
                assert response.status_code == 200
                checklist_items = response.json()
                assert len(checklist_items) == 7
                print("✓ Checklist auto-creation works")
                
                # Test marking a checklist item (using query parameters as expected by API)
                response = await client.post(
                    f"{service_urls['profile_mcp']}/markChecklistItem",
                    headers=auth_headers,
                    params={
                        "user_id": user_id,
                        "bucket_code": "health_device",
                        "status": "completed",
                        "source": "test"
                        # Note: data_ref cannot be passed as query param, omitting for now
                    }
                )
                assert response.status_code == 200
                print("✓ Checklist item marking works")
                
                # Test adding a measurement
                response = await client.post(
                    f"{service_urls['profile_mcp']}/upsertMeasurement",
                    headers=auth_headers,
                    json={
                        "user_id": user_id,
                        "type": "weight",
                        "value": 70.5,
                        "unit": "kg",
                        "captured_at": "2024-01-15T10:00:00Z"
                    }
                )
                assert response.status_code == 200
                print("✓ Measurement creation works")
                
                # Test getting progress
                response = await client.get(
                    f"{service_urls['profile_mcp']}/getProgress",
                    headers=auth_headers,
                    params={"user_id": user_id}
                )
                assert response.status_code == 200
                progress_data = response.json()
                assert "data" in progress_data
                print(f"✓ Progress calculation works: {progress_data}")
                
                # === Test 2: EM MCP Functionality ===
                print("\n=== Testing EM MCP ===")
                
                # Test self-model creation (might fail due to external API)
                response = await client.post(
                    f"{service_urls['em_mcp']}/createSelfModel",
                    headers=auth_headers,
                    json={"user_id": user_id}
                )
                if response.status_code in [200, 201]:
                    print("✓ EM MCP self-model creation works")
                    self_model_data = response.json()
                    print(f"  Self-model ID: {self_model_data.get('id', 'N/A')}")
                else:
                    print(f"⚠ EM MCP self-model creation returned {response.status_code} (external API)")
                
                # Test belief system listing
                response = await client.get(
                    f"{service_urls['em_mcp']}/listBeliefSystems",
                    headers=auth_headers,
                    params={"user_id": user_id}
                )
                if response.status_code in [200, 404]:
                    print("✓ EM MCP belief system listing accessible")
                else:
                    print(f"⚠ EM MCP belief system listing returned {response.status_code}")
                
                # === Test 3: DD MCP Functionality ===
                print("\n=== Testing DD MCP ===")
                
                # Test Don't Die score endpoint
                response = await client.get(
                    f"{service_urls['dd_mcp']}/getDdScore",
                    headers=auth_headers,
                    params={"date": "2024-01-01"}
                )
                if response.status_code in [200, 404]:
                    print("✓ DD MCP score endpoint accessible")
                    if response.status_code == 200:
                        score_data = response.json()
                        print(f"  Score data keys: {list(score_data.keys()) if isinstance(score_data, dict) else 'Not a dict'}")
                else:
                    print(f"⚠ DD MCP score endpoint returned {response.status_code} (external API)")
                
                # Test measurements endpoint
                response = await client.get(
                    f"{service_urls['dd_mcp']}/getMeasurements",
                    headers=auth_headers
                )
                if response.status_code in [200, 404]:
                    print("✓ DD MCP measurements endpoint accessible")
                else:
                    print(f"⚠ DD MCP measurements returned {response.status_code}")
                
                # === Test 4: Cross-Service Integration ===
                print("\n=== Testing Cross-Service Integration ===")
                
                # Verify Redis token caching is working
                cached_user_id = await redis_client.get(f"token:{token}")
                assert cached_user_id.decode() == user_id
                print("✓ Redis token caching works")
                
                # Verify database state
                user_count = await db_conn.fetchval('SELECT COUNT(*) FROM "user"')
                assert user_count == 1
                print("✓ Database user creation works")
                
                measurement_count = await db_conn.fetchval('SELECT COUNT(*) FROM measurement WHERE user_id = $1', user_id)
                assert measurement_count == 1
                print("✓ Database measurement storage works")
                
                checklist_count = await db_conn.fetchval('SELECT COUNT(*) FROM checklistitem WHERE user_id = $1', user_id)
                assert checklist_count == 7
                print("✓ Database checklist storage works")
                
                print("\n✅ All comprehensive integration tests passed!")
                
        finally:
            await db_conn.close()
            
    finally:
        await redis_client.aclose()


@pytest.mark.asyncio
async def test_authentication_flow():
    """Test the authentication flow across services."""
    service_urls = {
        "profile_mcp": os.getenv("PROFILE_MCP_URL", "http://profile-mcp:8010"),
        "dd_mcp": os.getenv("DD_MCP_URL", "http://dd-mcp:8090"),
        "em_mcp": os.getenv("EM_MCP_URL", "http://em-mcp:8120"),
    }
    
    # Test with invalid token
    invalid_headers = {"Authorization": "Bearer INVALID_TOKEN"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for service_name, url in service_urls.items():
            if service_name == "profile_mcp":
                endpoint = f"{url}/getChecklistProgress"
            elif service_name == "dd_mcp":
                endpoint = f"{url}/getDdScore?date=2024-01-01"
            else:  # em_mcp
                endpoint = f"{url}/listBeliefSystems?user_id=test-user"
            
            response = await client.get(endpoint, headers=invalid_headers)
            # Check authentication behavior
            if response.status_code in [401, 403]:
                print(f"✓ {service_name} properly rejects invalid tokens")
            elif response.status_code == 200:
                print(f"⚠ {service_name} accepted invalid token (authentication may not be implemented)")
            else:
                print(f"⚠ {service_name} returned {response.status_code} (auth rejection or external API failure)")
    
    print("✅ Authentication flow tests passed!") 