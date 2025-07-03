"""
Authentication utilities
"""
from fastapi import HTTPException, Header
from typing import Optional

from app.core.config import settings


async def verify_api_key(authorization: Optional[str] = Header(None)) -> str:
    """Verify API key from Authorization header"""
    if not settings.API_KEY:
        return "development"  # Skip auth in development
        
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
        
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
        
    token = authorization.split(" ")[1]
    
    if token != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
        
    return token