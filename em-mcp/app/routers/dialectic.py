"""
Dialectic router for em-mcp service.
"""
import os
import httpx
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging

from ..em_sdk_client import create_dialectic as sdk_create_dialectic, update_dialectic as sdk_update_dialectic, get_user_id_from_token
from ..proto_adapter import proto_to_dialectic, dialectic_to_dict

logger = logging.getLogger(__name__)
router = APIRouter()

PROFILE_MCP_URL = os.getenv("PROFILE_MCP_URL", "http://profile-mcp:8010")


class CreateDialecticRequest(BaseModel):
    user_id: str
    dialectic_type: Optional[str] = "DEFAULT"
    learning_objective: Optional[Dict[str, Any]] = None
    perspective_model_ids: Optional[List[str]] = None


class UpdateDialecticRequest(BaseModel):
    dialectic_id: str
    user_id: str
    answer: str
    custom_question: Optional[str] = None
    dry_run: Optional[bool] = False


@router.post("/createDialectic", operation_id="createDialectic")
async def create_dialectic(
    request: CreateDialecticRequest,
    authorization: str = Header(..., alias="Authorization")
) -> Dict[str, Any]:
    """Create a new dialectic via Epistemic Me SDK."""
    try:
        # Extract token from Authorization header
        logger.debug(f"Received authorization: {authorization}, type: {type(authorization)}")
        auth_str = str(authorization) if authorization else ""
        logger.debug(f"Auth string: {auth_str}")
        if not auth_str.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        token = auth_str[7:]  # Remove "Bearer " prefix
        
        # Call EM SDK
        em_response = await sdk_create_dialectic(
            self_model_id=request.user_id,
            dialectic_type=request.dialectic_type or "DEFAULT",
            learning_objective=request.learning_objective
        )
        
        # Convert to Pydantic model and back to dict for consistent response
        dialectic = proto_to_dialectic(em_response)
        
        return {
            "status": "ok",
            "data": dialectic_to_dict(dialectic)
        }
        
    except HTTPException:
        raise  # Re-raise HTTPExceptions to preserve status codes
    except Exception as e:
        logger.error(f"Error creating dialectic: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/updateDialectic", operation_id="updateDialectic")
async def update_dialectic(
    request: UpdateDialecticRequest,
    authorization: str = Header(..., alias="Authorization")
) -> Dict[str, Any]:
    """Update a dialectic with a user answer via Epistemic Me SDK."""
    try:
        # Extract token from Authorization header
        auth_str = str(authorization) if authorization else ""
        if not auth_str.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        token = auth_str[7:]  # Remove "Bearer " prefix
        
        # Call EM SDK
        em_response = await sdk_update_dialectic(
            dialectic_id=request.dialectic_id,
            answer=request.answer,
            self_model_id=request.user_id,
            custom_question=request.custom_question,
            dry_run=request.dry_run or False
        )
        
        # Convert to Pydantic model and back to dict for consistent response
        dialectic = proto_to_dialectic(em_response)
        
        return {
            "status": "ok",
            "data": dialectic_to_dict(dialectic)
        }
        
    except HTTPException:
        raise  # Re-raise HTTPExceptions to preserve status codes
    except Exception as e:
        logger.error(f"Error updating dialectic: {e}")
        return {"status": "error", "message": str(e)} 