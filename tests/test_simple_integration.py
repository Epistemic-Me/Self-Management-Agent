import asyncio
import os
import pytest
import httpx
import redis.asyncio as redis
import asyncpg
import uuid


@pytest.mark.asyncio
async def test_services_basic_functionality():
    """Test basic functionality of all services."""
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
        database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5434/postgres")
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
        db_conn = await asyncpg.connect(database_url)
        
        try:
            # Clear database tables (using correct table names)
            tables_to_truncate = [
                "belief", "beliefsystem", "measurement", 
                "userfile", "checklistitem", "selfmodel", "user"
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
                # Test 1: Check that services are responding
                for service_name, url in service_urls.items():
                    response = await client.get(f"{url}/docs")
                    assert response.status_code == 200, f"{service_name} not responding"
                    print(f"✓ {service_name} is responding")
                
                # Test 2: Test profile-mcp checklist creation
                response = await client.get(
                    f"{service_urls['profile_mcp']}/getChecklistProgress",
                    headers=auth_headers
                )
                assert response.status_code == 200, f"Checklist API failed: {response.status_code}"
                checklist_data = response.json()
                # The API returns a list directly, not a dict with "items"
                assert isinstance(checklist_data, list), f"Expected list, got {type(checklist_data)}"
                assert len(checklist_data) == 7, f"Expected 7 items, got {len(checklist_data)}"  # Should auto-create 7 items
                print("✓ Profile MCP checklist auto-creation works")
                
                # Test 3: Test em-mcp self-model creation
                response = await client.post(
                    f"{service_urls['em_mcp']}/createSelfModel",
                    headers=auth_headers,
                    json={"user_id": user_id}
                )
                # This might fail due to external API, but should not be a 401
                if response.status_code not in [200, 201, 500, 502, 503]:
                    assert False, f"EM MCP unexpected status: {response.status_code}"
                print(f"✓ EM MCP self-model endpoint accessible: {response.status_code}")
                
                # Test 4: Test dd-mcp score endpoint
                response = await client.get(
                    f"{service_urls['dd_mcp']}/getDdScore?date=2024-01-01",
                    headers=auth_headers
                )
                # This might fail due to external API, but should not be a 401
                if response.status_code not in [200, 404, 500, 502, 503]:
                    assert False, f"DD MCP unexpected status: {response.status_code}"
                print(f"✓ DD MCP score endpoint accessible: {response.status_code}")
                
                print("✓ All basic integration tests passed!")
                
        finally:
            await db_conn.close()
            
    finally:
        await redis_client.aclose()  # Use aclose() instead of close() 