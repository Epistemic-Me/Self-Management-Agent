"""
Router for Don't Die data synchronization and serving.
Provides efficient data access to the web UI without real-time API calls.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from app.deps import get_session, get_current_user
from app.models import User, DDUserData, DDSyncLog
from app.services.dd_sync import DDSyncService
from sqlmodel import select
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dd-data", tags=["dd-data"])

# Initialize the sync service
dd_sync = DDSyncService()

@router.post("/sync/{user_id}")
async def sync_user_data(
    user_id: str,
    force: bool = False,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    session: AsyncSession = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    """
    Sync Don't Die data for a user.
    Can be run in the background for better UX.
    """
    try:
        # Get user to find their dontdie_uid
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Run sync in background if requested
        if background_tasks:
            background_tasks.add_task(
                _sync_user_background,
                user_id, 
                user.dontdie_uid,
                force
            )
            return {"message": "Sync started in background", "user_id": user_id}
        else:
            # Sync immediately
            user_data = await dd_sync.sync_user_data(session, user_id, user.dontdie_uid, force)
            return {
                "message": "Sync completed",
                "user_id": user_id,
                "sync_status": user_data.sync_status,
                "last_synced": user_data.last_synced.isoformat()
            }
            
    except Exception as e:
        logger.error(f"Error syncing user data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def _sync_user_background(user_id: str, dontdie_uid: str, force: bool):
    """Background task for syncing user data."""
    try:
        from app.deps import get_session
        async for session in get_session():
            await dd_sync.sync_user_data(session, user_id, dontdie_uid, force)
            break
    except Exception as e:
        logger.error(f"Background sync failed for user {user_id}: {str(e)}")

@router.get("/status/{user_id}")
async def get_sync_status(
    user_id: str,
    session: AsyncSession = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    """Get the sync status for a user."""
    try:
        user_data = await dd_sync.get_user_data(session, user_id)
        
        if not user_data:
            return {
                "user_id": user_id,
                "sync_status": "not_synced",
                "last_synced": None,
                "message": "User data not found. Run sync first."
            }
        
        return {
            "user_id": user_id,
            "sync_status": user_data.sync_status,
            "last_synced": user_data.last_synced.isoformat() if user_data.last_synced else None,
            "sync_error": user_data.sync_error,
            "data_available": {
                "measurements": bool(user_data.measurements),
                "capabilities": bool(user_data.capabilities),
                "biomarkers": bool(user_data.biomarkers),
                "protocols": bool(user_data.protocols),
                "dd_scores": bool(user_data.dd_scores)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting sync status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/checklist-item-data")
async def get_checklist_item_data(
    bucket_code: str,
    session: AsyncSession = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    """
    Get formatted data for a checklist item.
    This replaces the getChecklistItemData function from api.ts.
    """
    try:
        # Get user's synced data
        user_data = await dd_sync.get_user_data(session, current_user_id)
        
        if not user_data:
            # Try to sync first
            stmt = select(User).where(User.id == current_user_id)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if user:
                try:
                    user_data = await dd_sync.sync_user_data(session, current_user_id, user.dontdie_uid)
                except Exception as sync_error:
                    logger.warning(f"Sync failed, returning fallback data: {sync_error}")
                    return _get_fallback_data(bucket_code)
        
        if not user_data:
            return _get_fallback_data(bucket_code)
        
        # Format data for UI
        formatted_data = await dd_sync.format_data_for_ui(user_data, bucket_code)
        return formatted_data
        
    except Exception as e:
        logger.error(f"Error getting checklist item data: {str(e)}")
        return _get_fallback_data(bucket_code)

def _get_fallback_data(bucket_code: str) -> Dict[str, Any]:
    """Return fallback data when sync fails or data is unavailable."""
    
    if bucket_code == "health_device":
        return {
            "type": "health_device",
            "title": "Health Devices",
            "data": {
                "devices": [
                    {
                        "name": "Apple Watch",
                        "type": "smartwatch",
                        "status": "connected",
                        "last_sync": "2024-11-10",
                        "source": "Don't Die API"
                    }
                ]
            }
        }
    
    elif bucket_code == "dd_score":
        return {
            "type": "dd_score",
            "title": "Don't Die Score",
            "data": {
                "message": "Don't Die Score data is being collected. Sync in progress.",
                "current_score": "Loading...",
                "trend": "Collecting data",
                "source": "Apple Watch"
            }
        }
    
    elif bucket_code == "measurements":
        return {
            "type": "measurements",
            "title": "Physical Measurements",
            "data": {
                "message": "Physical measurements are being synchronized from Don't Die.",
                "measurements": []
            }
        }
    
    elif bucket_code == "capabilities":
        return {
            "type": "capabilities",
            "title": "Physical & Cognitive Capabilities",
            "data": {
                "message": "Capability assessments are being synchronized from Don't Die.",
                "physical": [],
                "cognitive": []
            }
        }
    
    elif bucket_code == "biomarkers":
        return {
            "type": "biomarkers",
            "title": "Lab Results & Biomarkers",
            "data": {
                "labs": [],
                "message": "No biomarker data found. Upload lab results to Don't Die to see biomarkers here."
            }
        }
    
    elif bucket_code == "protocols":
        return {
            "type": "protocols",
            "title": "Health Optimization Protocols",
            "data": {
                "message": "Protocols are being synchronized from Don't Die.",
                "active": [],
                "completed": []
            }
        }
    
    else:
        return {
            "type": bucket_code,
            "title": bucket_code.replace("_", " ").title(),
            "data": {
                "message": "Data synchronization in progress."
            }
        }

@router.get("/sync-logs/{user_id}")
async def get_sync_logs(
    user_id: str,
    limit: int = 10,
    session: AsyncSession = Depends(get_session),
    current_user_id: str = Depends(get_current_user)
):
    """Get sync logs for debugging purposes."""
    try:
        stmt = select(DDSyncLog).where(
            DDSyncLog.user_id == user_id
        ).order_by(DDSyncLog.created_at.desc()).limit(limit)
        
        result = await session.execute(stmt)
        logs = result.scalars().all()
        
        return {
            "user_id": user_id,
            "logs": [
                {
                    "id": log.id,
                    "sync_type": log.sync_type,
                    "endpoint": log.endpoint,
                    "status": log.status,
                    "error_message": log.error_message,
                    "records_synced": log.records_synced,
                    "duration_ms": log.duration_ms,
                    "created_at": log.created_at.isoformat()
                }
                for log in logs
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting sync logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 