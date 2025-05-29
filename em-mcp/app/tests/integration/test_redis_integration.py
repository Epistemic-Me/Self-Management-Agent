"""
Integration tests for Redis token caching functionality.
"""
import pytest
import respx
import httpx
from unittest.mock import patch

from ...em_sdk_client import get_user_id_from_token, get_redis_client


@pytest.mark.asyncio
async def test_token_caching_flow(mock_env_vars):
    """Test the complete token caching flow."""
    token = "test-token-123"
    user_id = "user-456"
    
    # Get Redis client for verification
    redis_client = await get_redis_client()
    await redis_client.flushdb()  # Clear any existing data
    
    with respx.mock:
        # Mock the EM API /whoami endpoint
        respx.get("http://localhost:8080/whoami").mock(
            return_value=httpx.Response(200, json={"user_id": user_id})
        )
        
        # First call should hit the API and cache the result
        result1 = await get_user_id_from_token(token)
        assert result1 == user_id
        
        # Verify the token was cached in Redis
        cache_key = f"token:{token}"
        cached_value = await redis_client.get(cache_key)
        assert cached_value.decode() == user_id
        
        # Second call should use the cache (no API call)
        result2 = await get_user_id_from_token(token)
        assert result2 == user_id
        
        # Verify only one API call was made
        assert len(respx.calls) == 1
    
    # Clean up
    await redis_client.flushdb()


@pytest.mark.skip(reason="Redis event loop conflicts in test environment")
@pytest.mark.asyncio
async def test_token_cache_expiry(mock_env_vars):
    """Test that token cache has proper TTL."""
    token = "test-token-expiry"
    user_id = "user-expiry"
    
    # Create a fresh Redis client for this test
    import redis.asyncio as redis
    redis_client = redis.from_url("redis://localhost:6380/0")
    await redis_client.flushdb()
    
    try:
        with respx.mock:
            # Mock the EM API /whoami endpoint
            respx.get("http://localhost:8080/whoami").mock(
                return_value=httpx.Response(200, json={"user_id": user_id})
            )
            
            # Cache the token
            await get_user_id_from_token(token)
            
            # Check TTL is set (should be 86400 seconds = 24 hours)
            cache_key = f"token:{token}"
            ttl = await redis_client.ttl(cache_key)
            assert ttl > 86000  # Should be close to 86400 but allow some variance
            assert ttl <= 86400
    finally:
        try:
            await redis_client.flushdb()
            await redis_client.aclose()
        except Exception:
            pass


@pytest.mark.skip(reason="Redis event loop conflicts in test environment")
@pytest.mark.asyncio
async def test_token_cache_miss_api_failure(mock_env_vars):
    """Test behavior when token is not cached and API call fails."""
    token = "test-token-fail"
    
    # Get Redis client for verification
    redis_client = await get_redis_client()
    await redis_client.flushdb()
    
    with respx.mock:
        # Mock the EM API to return an error
        respx.get("http://localhost:8080/whoami").mock(
            return_value=httpx.Response(401, json={"error": "Unauthorized"})
        )
        
        # Should return None when API call fails
        result = await get_user_id_from_token(token)
        assert result is None
        
        # Should not cache failed results
        cache_key = f"token:{token}"
        cached_value = await redis_client.get(cache_key)
        assert cached_value is None
    
    # Clean up
    await redis_client.flushdb()


@pytest.mark.asyncio
async def test_redis_connection_handling(mock_env_vars):
    """Test Redis connection management."""
    # Create a fresh Redis client for this test
    import redis.asyncio as redis
    redis_client = redis.from_url("redis://localhost:6380/0")
    
    try:
        # Test that we can get a Redis client
        assert redis_client is not None
        
        # Test basic Redis operations
        await redis_client.set("test_key", "test_value")
        value = await redis_client.get("test_key")
        assert value.decode() == "test_value"
        
        # Clean up
        await redis_client.delete("test_key")
    finally:
        try:
            await redis_client.aclose()
        except Exception:
            pass


@pytest.mark.skip(reason="Redis event loop conflicts in test environment")
@pytest.mark.asyncio
async def test_multiple_tokens_caching(mock_env_vars):
    """Test caching multiple different tokens."""
    tokens_and_users = [
        ("token1", "user1"),
        ("token2", "user2"),
        ("token3", "user3")
    ]
    
    # Get Redis client for verification
    redis_client = await get_redis_client()
    await redis_client.flushdb()
    
    # Test each token individually to avoid respx conflicts
    for token, expected_user_id in tokens_and_users:
        with respx.mock:
            # Mock response for this specific token
            respx.get("http://localhost:8080/whoami").mock(
                return_value=httpx.Response(200, json={"user_id": expected_user_id})
            )
            
            # Cache the token
            result = await get_user_id_from_token(token)
            assert result == expected_user_id
            
            # Verify token is cached
            cache_key = f"token:{token}"
            cached_value = await redis_client.get(cache_key)
            assert cached_value.decode() == expected_user_id
    
    # Clean up
    await redis_client.flushdb()


@pytest.mark.skip(reason="Redis event loop conflicts in test environment")
@pytest.mark.asyncio
async def test_token_cache_with_bytes_response(mock_env_vars):
    """Test handling of bytes vs string responses from Redis."""
    token = "test-token-bytes"
    user_id = "user-bytes"
    
    # Create a fresh Redis client for this test
    import redis.asyncio as redis
    redis_client = redis.from_url("redis://localhost:6380/0")
    await redis_client.flushdb()
    
    try:
        # Manually set a value in Redis as bytes
        cache_key = f"token:{token}"
        await redis_client.set(cache_key, user_id.encode())
        
        # Should handle bytes response correctly
        result = await get_user_id_from_token(token)
        assert result == user_id
    finally:
        try:
            await redis_client.flushdb()
            await redis_client.aclose()
        except Exception:
            pass 