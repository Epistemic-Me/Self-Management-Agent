"""
Health check endpoint
"""
from fastapi import APIRouter
from datetime import datetime
import sys

router = APIRouter()


@router.get("/")
async def health_check():
    """Service health check"""
    return {
        "status": "healthy",
        "service": "health-coach-mcp",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    }