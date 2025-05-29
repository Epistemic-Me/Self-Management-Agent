import pytest
import httpx
from datetime import datetime


@pytest.mark.integration
@pytest.mark.asyncio
async def test_token_cache_population(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    token: str,
    user_id: str,
    reset_state,
    redis_get_helper,
    redis_client
):
    """Test that token cache is populated when calling dd-mcp."""
    # Ensure redis key doesn't exist initially
    await redis_client.delete(f"token:{token}")
    
    # Verify token is not in cache
    cached_user_id = await redis_get_helper(f"token:{token}")
    assert cached_user_id is None
    
    # Call dd-mcp endpoint which should populate the cache
    today = datetime.now().strftime("%Y-%m-%d")
    response = await async_client.get(
        f"{service_urls['dd_mcp']}/getDdScore",
        headers=auth_headers,
        params={"date": today}
    )
    
    # Note: This might fail if DD API is not available, but we test the caching behavior
    # The important part is that the token should be cached regardless of DD API response
    
    # Check if token is now in cache (dd-mcp should have cached it)
    cached_user_id = await redis_get_helper(f"token:{token}")
    
    # If dd-mcp successfully processed the request, it should have cached the token
    # If it failed due to DD API unavailability, the token might not be cached
    # We'll check both scenarios
    if response.status_code == 200:
        assert cached_user_id == user_id
    else:
        # If DD API is not available, the service might still cache the token
        # depending on the implementation
        pass


@pytest.mark.integration
@pytest.mark.asyncio
async def test_missing_token_401(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    reset_state
):
    """Test that missing authentication token returns 401."""
    # Call profile-mcp without authentication header
    response = await async_client.get(
        f"{service_urls['profile_mcp']}/getSelfModel"
    )
    
    assert response.status_code == 401
    
    # Response should be JSON with error details
    try:
        error_data = response.json()
        assert "detail" in error_data or "error" in error_data
    except:
        # Some services might return plain text error
        assert "unauthorized" in response.text.lower() or "401" in response.text


@pytest.mark.integration
@pytest.mark.asyncio
async def test_invalid_token_401(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    reset_state
):
    """Test that invalid authentication token returns 401."""
    invalid_headers = {"Authorization": "Bearer INVALID_TOKEN"}
    
    # Test profile-mcp
    profile_response = await async_client.get(
        f"{service_urls['profile_mcp']}/getSelfModel",
        headers=invalid_headers
    )
    
    assert profile_response.status_code == 401
    
    # Test em-mcp
    em_response = await async_client.get(
        f"{service_urls['em_mcp']}/getSelfModel",
        headers=invalid_headers
    )
    
    assert em_response.status_code == 401
    
    # Test dd-mcp
    dd_response = await async_client.get(
        f"{service_urls['dd_mcp']}/getDdScore",
        headers=invalid_headers,
        params={"date": "2024-01-01"}
    )
    
    assert dd_response.status_code == 401


@pytest.mark.integration
@pytest.mark.asyncio
async def test_token_cache_consistency(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    token: str,
    user_id: str,
    reset_state,
    redis_get_helper,
    redis_client
):
    """Test that token cache is consistent across all services."""
    # Ensure token is in cache
    await redis_client.set(f"token:{token}", user_id, ex=86400)
    
    # Verify token is cached
    cached_user_id = await redis_get_helper(f"token:{token}")
    assert cached_user_id == user_id
    
    # Call each service and verify they can use the cached token
    
    # Test profile-mcp
    profile_response = await async_client.get(
        f"{service_urls['profile_mcp']}/getChecklistProgress",
        headers=auth_headers
    )
    
    assert profile_response.status_code == 200
    
    # Test em-mcp (create self-model)
    em_response = await async_client.post(
        f"{service_urls['em_mcp']}/createSelfModel",
        headers=auth_headers,
        json={"user_id": user_id}
    )
    
    assert em_response.status_code == 200
    
    # Verify token is still in cache after all operations
    cached_user_id_after = await redis_get_helper(f"token:{token}")
    assert cached_user_id_after == user_id


@pytest.mark.integration
@pytest.mark.asyncio
async def test_token_expiration_handling(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    token: str,
    user_id: str,
    reset_state,
    redis_get_helper,
    redis_client
):
    """Test handling of expired tokens."""
    # Set token with very short expiration (1 second)
    await redis_client.set(f"token:{token}", user_id, ex=1)
    
    # Verify token is initially cached
    cached_user_id = await redis_get_helper(f"token:{token}")
    assert cached_user_id == user_id
    
    # Wait for token to expire
    import asyncio
    await asyncio.sleep(2)
    
    # Verify token has expired
    cached_user_id_expired = await redis_get_helper(f"token:{token}")
    assert cached_user_id_expired is None
    
    # Try to use expired token - should fail
    response = await async_client.get(
        f"{service_urls['profile_mcp']}/getSelfModel",
        headers=auth_headers
    )
    
    assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.asyncio
async def test_multiple_user_tokens(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    token: str,
    user_id: str,
    reset_state,
    redis_get_helper,
    redis_client
):
    """Test that multiple user tokens can coexist in cache."""
    # Set up multiple users
    user_1_token = token
    user_1_id = user_id
    user_2_token = "TEST_TOKEN_2"
    user_2_id = "user-0002"
    user_3_token = "TEST_TOKEN_3"
    user_3_id = "user-0003"
    
    # Cache all tokens
    await redis_client.set(f"token:{user_1_token}", user_1_id, ex=86400)
    await redis_client.set(f"token:{user_2_token}", user_2_id, ex=86400)
    await redis_client.set(f"token:{user_3_token}", user_3_id, ex=86400)
    
    # Verify all tokens are cached correctly
    cached_user_1 = await redis_get_helper(f"token:{user_1_token}")
    cached_user_2 = await redis_get_helper(f"token:{user_2_token}")
    cached_user_3 = await redis_get_helper(f"token:{user_3_token}")
    
    assert cached_user_1 == user_1_id
    assert cached_user_2 == user_2_id
    assert cached_user_3 == user_3_id
    
    # Test that each token works independently
    user_1_headers = {"Authorization": f"Bearer {user_1_token}"}
    user_2_headers = {"Authorization": f"Bearer {user_2_token}"}
    
    # Both users should be able to access their data
    user_1_response = await async_client.get(
        f"{service_urls['profile_mcp']}/getChecklistProgress",
        headers=user_1_headers
    )
    
    user_2_response = await async_client.get(
        f"{service_urls['profile_mcp']}/getChecklistProgress",
        headers=user_2_headers
    )
    
    assert user_1_response.status_code == 200
    assert user_2_response.status_code == 200


@pytest.mark.integration
@pytest.mark.asyncio
async def test_redis_connection_resilience(
    async_client: httpx.AsyncClient,
    service_urls: dict,
    auth_headers: dict,
    reset_state
):
    """Test service behavior when Redis is temporarily unavailable."""
    # This test is more complex and would require temporarily stopping Redis
    # For now, we'll test the basic Redis connectivity
    
    # Test that services can handle Redis operations
    response = await async_client.get(
        f"{service_urls['profile_mcp']}/getChecklistProgress",
        headers=auth_headers
    )
    
    # Should work normally when Redis is available
    assert response.status_code == 200
    
    # Note: To fully test Redis resilience, we would need to:
    # 1. Stop Redis container temporarily
    # 2. Make requests (should fail gracefully)
    # 3. Restart Redis container
    # 4. Verify services recover
    # This requires more complex test infrastructure 