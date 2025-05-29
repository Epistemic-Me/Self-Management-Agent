import pytest
import pytest_asyncio
import redis.asyncio as redis
from httpx import AsyncClient, ASGITransport
from app.main import app
from uuid import uuid4
import os


@pytest_asyncio.fixture
async def sim_queue_redis():
    """Redis client for simulation job queue testing."""
    sim_queue_url = os.getenv("SIM_JOB_QUEUE_URL", "redis://localhost:6379/1")
    r = redis.from_url(sim_queue_url)
    try:
        # Clear any existing jobs
        await r.delete("simulation_jobs")
        yield r
        # Cleanup
        await r.delete("simulation_jobs")
    finally:
        try:
            await r.aclose()
        except Exception:
            # Ignore errors during cleanup
            pass


@pytest_asyncio.fixture
async def client():
    """Test client for making API requests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_simulate_conversation_enqueue_job(client, auth_headers, sim_queue_redis):
    """Test that simulateConversation endpoint enqueues job correctly."""
    # Test data
    user_id = str(uuid4())
    template = "default_sleep"
    
    request_data = {
        "user_id": user_id,
        "template": template
    }
    
    # Make the API request
    response = await client.post(
        "/simulateConversation",
        json=request_data,
        headers=auth_headers
    )
    
    # Assert successful response
    assert response.status_code == 200
    response_data = response.json()
    assert response_data["status"] == "ok"
    assert response_data["data"]["queued"] is True
    
    # Assert job was enqueued in Redis
    queue_length = await sim_queue_redis.llen("simulation_jobs")
    assert queue_length == 1
    
    # Verify the job data
    job_data = await sim_queue_redis.lpop("simulation_jobs")
    assert job_data is not None
    
    import json
    job_json = json.loads(job_data)
    assert job_json["user_id"] == user_id
    assert job_json["template"] == template


@pytest.mark.asyncio
async def test_simulate_conversation_multiple_jobs(client, auth_headers, sim_queue_redis):
    """Test that multiple jobs can be enqueued."""
    jobs_to_create = 3
    
    for i in range(jobs_to_create):
        request_data = {
            "user_id": str(uuid4()),
            "template": f"template_{i}"
        }
        
        response = await client.post(
            "/simulateConversation",
            json=request_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.json()["data"]["queued"] is True
    
    # Assert all jobs were enqueued
    queue_length = await sim_queue_redis.llen("simulation_jobs")
    assert queue_length == jobs_to_create


@pytest.mark.asyncio
async def test_simulate_conversation_default_template(client, auth_headers, sim_queue_redis):
    """Test that default template is used when not specified."""
    user_id = str(uuid4())
    
    request_data = {
        "user_id": user_id
        # template not specified, should default to "default"
    }
    
    response = await client.post(
        "/simulateConversation",
        json=request_data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert response.json()["data"]["queued"] is True
    
    # Verify default template was used
    job_data = await sim_queue_redis.lpop("simulation_jobs")
    import json
    job_json = json.loads(job_data)
    assert job_json["template"] == "default"


@pytest.mark.asyncio
async def test_simulate_conversation_unauthorized(client, sim_queue_redis):
    """Test that unauthorized requests are rejected."""
    request_data = {
        "user_id": str(uuid4()),
        "template": "test"
    }
    
    # Request without auth headers
    response = await client.post(
        "/simulateConversation",
        json=request_data
    )
    
    # Should be unauthorized
    assert response.status_code == 403
    
    # No job should be enqueued
    queue_length = await sim_queue_redis.llen("simulation_jobs")
    assert queue_length == 0 