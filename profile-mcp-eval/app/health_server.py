import asyncio
import logging
import os
from datetime import datetime
from typing import Dict, Any

import redis.asyncio as redis
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from client import ProfileMCPClient

logger = logging.getLogger(__name__)

# Environment configuration
JOB_QUEUE_URL = os.getenv("JOB_QUEUE_URL", "redis://redis:6379/1")
PROFILE_MCP_BASE = os.getenv("PROFILE_MCP_BASE", "http://profile-mcp:8010")
TOKEN = os.getenv("TOKEN", "SIM_WORKER_TOKEN")


class HealthResponse(BaseModel):
    """Health check response model"""
    status: str
    timestamp: datetime
    queue_connection: bool
    profile_mcp_connection: bool
    details: Dict[str, Any] = {}


app = FastAPI(
    title="Profile MCP Eval - Background Worker",
    description="Background worker health check endpoint",
    version="1.0.0"
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint that verifies:
    - Redis queue connection
    - Profile MCP service connection
    - Overall worker status
    """
    timestamp = datetime.utcnow()
    details = {}
    
    # Check Redis connection
    queue_healthy = False
    try:
        redis_client = redis.from_url(JOB_QUEUE_URL, decode_responses=True)
        await redis_client.ping()
        queue_healthy = True
        details["redis"] = "connected"
        await redis_client.close()
    except Exception as e:
        details["redis"] = f"error: {str(e)}"
        logger.warning(f"Redis health check failed: {str(e)}")
    
    # Check Profile MCP connection
    profile_mcp_healthy = False
    try:
        profile_client = ProfileMCPClient(PROFILE_MCP_BASE, TOKEN)
        profile_mcp_healthy = await profile_client.health_check()
        details["profile_mcp"] = "connected" if profile_mcp_healthy else "unreachable"
        await profile_client.close()
    except Exception as e:
        details["profile_mcp"] = f"error: {str(e)}"
        logger.warning(f"Profile MCP health check failed: {str(e)}")
    
    # Overall status
    overall_healthy = queue_healthy and profile_mcp_healthy
    status = "healthy" if overall_healthy else "degraded"
    
    if not overall_healthy:
        logger.warning(f"Health check failed - Redis: {queue_healthy}, Profile MCP: {profile_mcp_healthy}")
    
    return HealthResponse(
        status=status,
        timestamp=timestamp,
        queue_connection=queue_healthy,
        profile_mcp_connection=profile_mcp_healthy,
        details=details
    )


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("HEALTH_PORT", "8100"))
    uvicorn.run(app, host="0.0.0.0", port=port) 