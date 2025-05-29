"""
Self Model router for em-mcp service.
"""
import os
import httpx
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

from ..em_sdk_client import create_self_model as sdk_create_self_model, get_self_model as sdk_get_self_model, get_user_id_from_token
from ..proto_adapter import proto_to_self_model, self_model_to_dict

logger = logging.getLogger(__name__)
router = APIRouter()

PROFILE_MCP_URL = os.getenv("PROFILE_MCP_URL", "http://profile-mcp:8010")


class CreateSelfModelRequest(BaseModel):
    user_id: str
    initial_name: Optional[str] = None


class GetSelfModelRequest(BaseModel):
    user_id: str


class SyncSelfModelRequest(BaseModel):
    user_id: str


@router.post("/createSelfModel", operation_id="createSelfModel")
async def create_self_model(
    request: CreateSelfModelRequest,
    authorization: str = Header(..., alias="Authorization")
) -> Dict[str, Any]:
    """Create a new self model via Epistemic Me SDK."""
    try:
        # Extract token from Authorization header
        logger.debug(f"Received authorization: {authorization}, type: {type(authorization)}")
        auth_str = str(authorization) if authorization else ""
        logger.debug(f"Auth string: {auth_str}")
        if not auth_str.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        token = auth_str[7:]  # Remove "Bearer " prefix
        
        # Prepare philosophies list
        philosophies = ["default"]  # Default philosophy
        
        # Call EM SDK
        em_response = await sdk_create_self_model(request.user_id, philosophies)
        
        # Convert to Pydantic model and back to dict for consistent response
        self_model = proto_to_self_model(em_response)
        
        return {
            "status": "ok",
            "data": self_model_to_dict(self_model)
        }
        
    except Exception as e:
        logger.error(f"Error creating self model: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/getSelfModel", operation_id="getSelfModel")
async def get_self_model(
    user_id: str,
    authorization: str = Header(..., alias="Authorization")
) -> Dict[str, Any]:
    """Get self model from Epistemic Me SDK."""
    try:
        # Extract token from Authorization header
        auth_str = str(authorization) if authorization else ""
        if not auth_str.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        token = auth_str[7:]  # Remove "Bearer " prefix
        
        # Call EM SDK
        em_response = await sdk_get_self_model(user_id)
        
        # Convert to Pydantic model and back to dict for consistent response
        self_model = proto_to_self_model(em_response)
        
        return {
            "status": "ok",
            "data": self_model_to_dict(self_model)
        }
        
    except Exception as e:
        logger.error(f"Error getting self model: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/syncSelfModelToProfile", operation_id="syncSelfModelToProfile")
async def sync_self_model_to_profile(
    request: SyncSelfModelRequest,
    authorization: str = Header(..., alias="Authorization")
) -> Dict[str, Any]:
    """Sync self model from EM to profile-mcp."""
    try:
        # Extract token from Authorization header
        auth_str = str(authorization) if authorization else ""
        if not auth_str.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        token = auth_str[7:]  # Remove "Bearer " prefix
        
        # Get self model from EM SDK
        em_response = await sdk_get_self_model(request.user_id)
        self_model = proto_to_self_model(em_response)
        
        # Get profile MCP URL dynamically to allow for testing
        profile_mcp_url = os.getenv("PROFILE_MCP_URL", "http://profile-mcp:8010")
        
        # Forward to profile-mcp
        async with httpx.AsyncClient() as client:
            profile_response = await client.post(
                f"{profile_mcp_url}/upsertSelfModel",
                json=self_model_to_dict(self_model),
                headers={"Authorization": auth_str}
            )
            profile_response.raise_for_status()
        
        return {
            "status": "ok",
            "data": {"synced": True}
        }
        
    except httpx.HTTPStatusError as e:
        logger.error(f"API error: {e.response.status_code} - {e.response.text}")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Error syncing self model: {e}")
        return {"status": "error", "message": str(e)} 