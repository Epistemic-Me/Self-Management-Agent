import asyncio
import os
import pytest
import httpx
import redis.asyncio as redis
import asyncpg
from typing import Dict, Any


# Remove custom event_loop fixture to let pytest-asyncio handle it


@pytest.fixture
def token() -> str:
    """Return the test token."""
    return "TEST_TOKEN"


@pytest.fixture
def user_id() -> str:
    """Return the test user ID."""
    return "user-0001"


@pytest.fixture
async def async_client():
    """Create an async HTTP client for making requests to the services."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        yield client


@pytest.fixture
async def redis_client():
    """Create a Redis client for cache operations."""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    client = redis.from_url(redis_url)
    yield client
    await client.close()


@pytest.fixture
async def db_connection():
    """Create a database connection for direct DB operations."""
    database_url = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5434/postgres")
    # Convert asyncpg URL format
    database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(database_url)
    yield conn
    await conn.close()


@pytest.fixture
async def reset_state(redis_client, db_connection, token: str, user_id: str):
    """Reset the state between tests by clearing Redis and truncating DB tables."""
    # Clear Redis
    await redis_client.flushdb()
    
    # Set up the test token mapping
    await redis_client.set(f"token:{token}", user_id, ex=86400)  # 24 hour TTL
    
    # Truncate database tables in dependency order (using correct table names)
    tables_to_truncate = [
        "belief",
        "beliefsystem", 
        "measurement",
        "userfile",
        "checklistitem",
        "selfmodel",
        '"user"'  # Quote the user table name since it's a reserved keyword
    ]
    
    for table in tables_to_truncate:
        try:
            await db_connection.execute(f"TRUNCATE TABLE {table} CASCADE")
        except Exception as e:
            # Table might not exist yet, continue
            print(f"Warning: Could not truncate {table}: {e}")
    
    yield
    
    # Cleanup after test
    await redis_client.flushdb()


@pytest.fixture
def service_urls() -> Dict[str, str]:
    """Return the service URLs for the MCP services."""
    return {
        "profile_mcp": os.getenv("PROFILE_MCP_URL", "http://localhost:8010"),
        "dd_mcp": os.getenv("DD_MCP_URL", "http://localhost:8090"),
        "em_mcp": os.getenv("EM_MCP_URL", "http://localhost:8120"),
    }


@pytest.fixture
def auth_headers(token: str) -> Dict[str, str]:
    """Return authentication headers with the test token."""
    return {"Authorization": f"Bearer {token}"}


async def get_row(db_connection: asyncpg.Connection, table: str, where_clause: str, params: list = None) -> Dict[str, Any]:
    """Helper function to get a single row from the database."""
    query = f"SELECT * FROM {table} WHERE {where_clause}"
    if params:
        row = await db_connection.fetchrow(query, *params)
    else:
        row = await db_connection.fetchrow(query)
    
    if row:
        return dict(row)
    return None


async def redis_get(redis_client, key: str) -> str:
    """Helper function to get a value from Redis."""
    value = await redis_client.get(key)
    return value.decode() if value else None


# Make helper functions available to tests
@pytest.fixture
def get_row_helper(db_connection):
    """Provide the get_row helper function to tests."""
    async def _get_row(table: str, where_clause: str, params: list = None):
        return await get_row(db_connection, table, where_clause, params)
    return _get_row


@pytest.fixture  
def redis_get_helper(redis_client):
    """Provide the redis_get helper function to tests."""
    async def _redis_get(key: str):
        return await redis_get(redis_client, key)
    return _redis_get 