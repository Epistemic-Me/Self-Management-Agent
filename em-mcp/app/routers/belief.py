"""
Belief router for em-mcp service.
"""
import httpx
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging

from ..em_sdk_client import create_belief as sdk_create_belief, list_beliefs as sdk_list_beliefs, get_belief_system as sdk_get_belief_system
from ..proto_adapter import proto_to_belief, proto_to_belief_system, belief_to_dict, belief_system_to_dict

logger = logging.getLogger(__name__)
router = APIRouter()


class UpdateBeliefRequest(BaseModel):
    user_id: str
    belief_system_id: str
    statement: str
    confidence: float
    context_uuid: Optional[str] = None
    belief_id: Optional[str] = None  # For updates


class DeleteBeliefRequest(BaseModel):
    user_id: str
    belief_id: str


@router.post("/updateBelief", operation_id="updateBelief")
async def update_belief(
    request: UpdateBeliefRequest,
    authorization: str = Header(..., alias="Authorization")
) -> Dict[str, Any]:
    """Create a belief via Epistemic Me SDK (update not supported yet)."""
    try:
        # Extract token from Authorization header
        auth_str = str(authorization) if authorization else ""
        if not auth_str.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        token = auth_str[7:]  # Remove "Bearer " prefix
        
        # Note: SDK currently only supports create_belief, not update
        if request.belief_id:
            logger.warning("Belief update not supported by SDK - treating as create")
        
        # Create belief content string from statement and confidence
        belief_content = f"{request.statement} (confidence: {request.confidence})"
        
        # Call EM SDK - using user_id as self_model_id for now
        em_response = await sdk_create_belief(request.user_id, belief_content)
        
        # Convert to Pydantic model and back to dict for consistent response
        belief = proto_to_belief(em_response)
        
        return {
            "status": "ok",
            "data": belief_to_dict(belief)
        }
        
    except Exception as e:
        logger.error(f"Error creating belief: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/listBeliefSystems", operation_id="listBeliefSystems")
async def list_belief_systems(
    user_id: str,
    authorization: str = Header(..., alias="Authorization")
) -> Dict[str, Any]:
    """Get belief system for a user via Epistemic Me SDK."""
    try:
        # Extract token from Authorization header
        auth_str = str(authorization) if authorization else ""
        if not auth_str.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        token = auth_str[7:]  # Remove "Bearer " prefix
        
        # Call EM SDK to get belief system
        em_response = await sdk_get_belief_system(user_id)
        
        # Convert response to belief system
        belief_system = proto_to_belief_system(em_response)
        
        # Return as a list for compatibility with the API contract
        return {
            "status": "ok",
            "data": [belief_system_to_dict(belief_system)]
        }
        
    except Exception as e:
        logger.error(f"Error getting belief system: {e}")
        return {"status": "error", "message": str(e)}


@router.delete("/deleteBelief", operation_id="deleteBelief")
async def delete_belief(
    request: DeleteBeliefRequest,
    authorization: str = Header(..., alias="Authorization")
) -> Dict[str, Any]:
    """Delete a belief - not supported by current SDK."""
    try:
        # Extract token from Authorization header
        auth_str = str(authorization) if authorization else ""
        if not auth_str.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header")
        
        token = auth_str[7:]  # Remove "Bearer " prefix
        
        # Note: SDK does not currently support deleting beliefs
        logger.warning(f"Delete belief not supported by SDK - belief_id: {request.belief_id}")
        
        return {
            "status": "error",
            "message": "Delete belief operation not supported by current SDK"
        }
        
    except Exception as e:
        logger.error(f"Error in delete belief: {e}")
        return {"status": "error", "message": str(e)} 