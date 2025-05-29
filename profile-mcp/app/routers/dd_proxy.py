"""
DD-MCP Proxy Router

Provides proxy endpoints to forward requests to the dd-mcp service with proper authentication.
This allows the web UI to access dd-mcp data without handling Don't Die API tokens client-side.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
import httpx
import os
from app.deps import get_current_user

router = APIRouter(prefix="/dd-proxy", tags=["dd-proxy"])

# Configuration
DD_MCP_BASE = "http://localhost:8090"
DD_TOKEN = os.getenv("DD_TOKEN", "")
DD_CLIENT_ID = os.getenv("DD_CLIENT_ID", "a1d36b5e-ee9b-4dbc-9b9c-9027c633fc9b")

# If no DD_TOKEN is available, we can try to use fallback authentication
if not DD_TOKEN:
    # Check for alternative token names
    DD_TOKEN = os.getenv("API_ACCESS_TOKEN", "")

async def make_dd_request(endpoint: str, params: dict = None):
    """Make an authenticated request to the dd-mcp service."""
    # Try different authentication approaches
    auth_headers = []
    
    if DD_TOKEN:
        auth_headers.append({
            "Authorization": f"Bearer {DD_TOKEN}",
            "Content-Type": "application/json",
            "x-dd-client-id": DD_CLIENT_ID,
        })
    
    # Fallback: try without authentication (for development)
    auth_headers.append({
        "Content-Type": "application/json",
    })
    
    async with httpx.AsyncClient() as client:
        for headers in auth_headers:
            try:
                response = await client.get(
                    f"{DD_MCP_BASE}/{endpoint}",
                    headers=headers,
                    params=params or {}
                )
                if response.status_code == 200:
                    return response.json()
                elif response.status_code != 401:  # Don't retry on auth errors
                    break
            except httpx.RequestError as e:
                if headers == auth_headers[-1]:  # Last attempt
                    raise HTTPException(
                        status_code=503,
                        detail=f"DD-MCP service unavailable: {str(e)}"
                    )
                continue
        
        # If we get here, the request failed
        raise HTTPException(
            status_code=response.status_code if 'response' in locals() else 503,
            detail=f"DD-MCP API error: {response.text if 'response' in locals() else 'Service unavailable'}"
        )

@router.get("/measurements")
async def get_measurements_proxy(user_id: str = Depends(get_current_user)):
    """Proxy endpoint for measurements data."""
    try:
        return await make_dd_request("getMeasurements")
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"error": "Measurements data not available", "detail": str(e)}
        )

@router.get("/capabilities")
async def get_capabilities_proxy(user_id: str = Depends(get_current_user)):
    """Proxy endpoint for capabilities data."""
    try:
        return await make_dd_request("getCapabilities")
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"error": "Capabilities data not available", "detail": str(e)}
        )

@router.get("/biomarkers")
async def get_biomarkers_proxy(user_id: str = Depends(get_current_user)):
    """Proxy endpoint for biomarkers data."""
    try:
        return await make_dd_request("getBiomarkers")
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"error": "Biomarkers data not available", "detail": str(e)}
        )

@router.get("/dd-score")
async def get_dd_score_proxy(
    user_id: str = Depends(get_current_user),
    date: str = None,
    days: int = 7
):
    """Proxy endpoint for DD score data."""
    try:
        params = {}
        if date:
            params["date"] = date
            if days:
                params["days"] = days
        return await make_dd_request("getDdScore", params)
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"error": "DD score data not available", "detail": str(e)}
        )

@router.get("/protocols")
async def get_protocols_proxy(user_id: str = Depends(get_current_user)):
    """Proxy endpoint for user protocols data."""
    try:
        return await make_dd_request("getUserProtocols")
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"error": "Protocols data not available", "detail": str(e)}
        ) 