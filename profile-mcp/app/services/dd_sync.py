"""
Service for synchronizing Don't Die data from dd-mcp to profile-mcp database.
This allows efficient data serving to the web UI without real-time API calls.
"""

import httpx
import os
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.models import DDUserData, DDSyncLog, ChecklistItem
import logging

logger = logging.getLogger(__name__)

class DDSyncService:
    """Service for synchronizing Don't Die data."""
    
    def __init__(self):
        # Use host.docker.internal for Docker containers to reach host services
        self.dd_mcp_base = os.getenv("DD_MCP_BASE_URL", "http://host.docker.internal:8090")
        self.dd_token = os.getenv("DD_TOKEN", "")
        self.dd_client_id = os.getenv("DD_CLIENT_ID", "a1d36b5e-ee9b-4dbc-9b9c-9027c633fc9b")
        
        # If no DD_TOKEN, try alternative names
        if not self.dd_token:
            self.dd_token = os.getenv("API_ACCESS_TOKEN", "")
    
    async def sync_user_data(self, session: AsyncSession, user_id: str, dontdie_uid: str, force: bool = False) -> DDUserData:
        """
        Sync all data for a user from dd-mcp.
        
        Args:
            session: Database session
            user_id: Profile-MCP user ID
            dontdie_uid: Don't Die user ID
            force: Force sync even if recently synced
            
        Returns:
            DDUserData object with synced data
        """
        start_time = time.time()
        
        # Get or create user data record
        stmt = select(DDUserData).where(DDUserData.user_id == user_id)
        result = await session.execute(stmt)
        user_data = result.scalar_one_or_none()
        
        if not user_data:
            user_data = DDUserData(
                user_id=user_id,
                dontdie_uid=dontdie_uid,
                sync_status="pending"
            )
            session.add(user_data)
        
        # Check if we need to sync (skip if recently synced and not forced)
        if not force and user_data.last_synced:
            time_since_sync = datetime.utcnow() - user_data.last_synced
            if time_since_sync < timedelta(minutes=5):  # Don't sync more than once per 5 minutes
                logger.info(f"Skipping sync for user {user_id} - recently synced {time_since_sync.total_seconds()}s ago")
                return user_data
        
        # Log sync start
        sync_log = DDSyncLog(
            user_id=user_id,
            sync_type="full",
            status="started"
        )
        session.add(sync_log)
        await session.commit()
        
        try:
            # Sync all endpoints
            await self._sync_measurements(user_data)
            await self._sync_capabilities(user_data)
            await self._sync_biomarkers(user_data)
            await self._sync_protocols(user_data)
            await self._sync_dd_scores(user_data)
            
            # Update sync status
            user_data.sync_status = "success"
            user_data.sync_error = None
            user_data.last_synced = datetime.utcnow()
            
            # Update checklist completion status based on data availability
            await self.update_checklist_status(session, user_id, user_data)
            
            # Update log
            duration_ms = int((time.time() - start_time) * 1000)
            sync_log.status = "success"
            sync_log.duration_ms = duration_ms
            sync_log.records_synced = 1
            
            await session.commit()
            logger.info(f"Successfully synced data for user {user_id} in {duration_ms}ms")
            
        except Exception as e:
            logger.error(f"Error syncing data for user {user_id}: {str(e)}")
            
            # Update error status
            user_data.sync_status = "error"
            user_data.sync_error = str(e)
            user_data.last_synced = datetime.utcnow()
            
            # Update log
            duration_ms = int((time.time() - start_time) * 1000)
            sync_log.status = "error"
            sync_log.error_message = str(e)
            sync_log.duration_ms = duration_ms
            
            await session.commit()
            raise
        
        return user_data
    
    async def _make_dd_request(self, endpoint: str, params: Dict[str, Any] = None) -> Any:
        """Make a request to dd-mcp service."""
        headers = {}
        
        # Try with authentication first
        if self.dd_token:
            headers = {
                "Authorization": f"Bearer {self.dd_token}",
                "Content-Type": "application/json",
                "x-dd-client-id": self.dd_client_id,
            }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.dd_mcp_base}/{endpoint}",
                    headers=headers,
                    params=params or {}
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 401 and headers:
                    # Try without auth as fallback
                    logger.warning(f"Auth failed for {endpoint}, trying without auth")
                    response = await client.get(
                        f"{self.dd_mcp_base}/{endpoint}",
                        params=params or {}
                    )
                    if response.status_code == 200:
                        return response.json()
                
                logger.error(f"DD-MCP API error for {endpoint}: {response.status_code} - {response.text}")
                return None
                
            except httpx.RequestError as e:
                logger.error(f"Request error for {endpoint}: {str(e)}")
                return None
    
    async def _sync_measurements(self, user_data: DDUserData):
        """Sync measurements data."""
        data = await self._make_dd_request("getMeasurements")
        if data is not None:
            user_data.set_measurements(data)
            logger.debug(f"Synced {len(data) if isinstance(data, list) else 0} measurements")
    
    async def _sync_capabilities(self, user_data: DDUserData):
        """Sync capabilities data."""
        data = await self._make_dd_request("getCapabilities")
        if data is not None:
            user_data.set_capabilities(data)
            logger.debug(f"Synced {len(data) if isinstance(data, list) else 0} capabilities")
    
    async def _sync_biomarkers(self, user_data: DDUserData):
        """Sync biomarkers data."""
        data = await self._make_dd_request("getBiomarkers")
        if data is not None:
            user_data.set_biomarkers(data)
            logger.debug(f"Synced {len(data) if isinstance(data, list) else 0} biomarkers")
    
    async def _sync_protocols(self, user_data: DDUserData):
        """Sync protocols data."""
        data = await self._make_dd_request("getUserProtocols")
        if data is not None:
            user_data.set_protocols(data)
            logger.debug(f"Synced {len(data) if isinstance(data, list) else 0} protocols")
    
    async def _sync_dd_scores(self, user_data: DDUserData):
        """Sync DD scores data."""
        params = {
            "date": "2025-05-29",
            "days": 7
        }
        data = await self._make_dd_request("getDdScore", params)
        if data is not None:
            user_data.set_dd_scores(data)
            logger.debug(f"Synced DD scores with {len(data) if isinstance(data, dict) else 0} days")
    
    async def get_user_data(self, session: AsyncSession, user_id: str) -> Optional[DDUserData]:
        """Get user's synced data from database."""
        stmt = select(DDUserData).where(DDUserData.user_id == user_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def format_data_for_ui(self, user_data: DDUserData, bucket_code: str) -> Dict[str, Any]:
        """Format synced data for the web UI based on bucket code."""
        
        if bucket_code == "dd_score":
            dd_scores = user_data.get_dd_scores()
            
            if dd_scores:
                # Process the data to extract scores and trend
                dates = sorted(dd_scores.keys())
                scores = []
                for date in dates:
                    score_data = dd_scores[date]
                    # Check if score_data is a dict and has a non-null score with points
                    if (isinstance(score_data, dict) and 
                        score_data.get("score") is not None and 
                        isinstance(score_data["score"], dict) and 
                        "points" in score_data["score"]):
                        scores.append({
                            "date": date,
                            "score": round(score_data["score"]["points"], 1)
                        })
                
                if scores:  # Only return data if we have valid scores
                    current_score = scores[-1]["score"]
                    trend = "stable"
                    if len(scores) > 1:
                        trend = "improving" if scores[-1]["score"] > scores[-2]["score"] else "declining"
                    
                    return {
                        "type": "dd_score",
                        "title": "Don't Die Score",
                        "data": {
                            "current_score": current_score,
                            "trend": trend,
                            "scores": scores,
                            "source": "Apple Watch",
                            "last_updated": scores[-1]["date"]
                        }
                    }
            
        elif bucket_code == "measurements":
            measurements = user_data.get_measurements()
            
            if measurements:
                formatted_measurements = []
                for m in measurements:
                    formatted_measurements.append({
                        "type": m.get("biomarkerName", "").lower().replace(" ", "_"),
                        "value": m.get("value"),
                        "unit": m.get("measurementUnit"),
                        "date": m.get("dateMeasured"),
                        "self_reported": m.get("isSelfReported", False)
                    })
                
                return {
                    "type": "measurements",
                    "title": "Physical Measurements",
                    "data": {
                        "measurements": formatted_measurements
                    }
                }
        
        elif bucket_code == "capabilities":
            capabilities = user_data.get_capabilities()
            
            if capabilities:
                physical = []
                for c in capabilities:
                    physical.append({
                        "test": c.get("biomarkerName"),
                        "value": c.get("value"),
                        "unit": c.get("measurementUnit"),
                        "date": c.get("dateMeasured"),
                        "percentile": "Unknown"  # Would need reference data
                    })
                
                return {
                    "type": "capabilities",
                    "title": "Physical & Cognitive Capabilities",
                    "data": {
                        "physical": physical,
                        "cognitive": []
                    }
                }
        
        elif bucket_code == "biomarkers":
            biomarkers = user_data.get_biomarkers()
            
            if biomarkers:
                labs = []
                for b in biomarkers:
                    labs.append({
                        "name": b.get("biomarkerName"),
                        "value": b.get("value"),
                        "unit": b.get("measurementUnit"),
                        "date": b.get("dateMeasured"),
                        "status": "unknown"
                    })
                
                return {
                    "type": "biomarkers",
                    "title": "Lab Results & Biomarkers",
                    "data": {
                        "labs": labs
                    }
                }
            else:
                return {
                    "type": "biomarkers",
                    "title": "Lab Results & Biomarkers",
                    "data": {
                        "labs": [],
                        "message": "No biomarker data found. Upload lab results to Don't Die to see biomarkers here."
                    }
                }
        
        elif bucket_code == "protocols":
            protocols = user_data.get_protocols()
            
            if protocols:
                active = []
                completed = []
                
                for p in protocols:
                    protocol_data = {
                        "name": p.get("name"),
                        "type": p.get("type"),
                        "description": p.get("description"),
                        "category": p.get("category")
                    }
                    
                    if p.get("status") == "Completed":
                        protocol_data.update({
                            "status": "completed",
                            "completion_date": p.get("updatedAt")
                        })
                        completed.append(protocol_data)
                    else:
                        protocol_data.update({
                            "status": p.get("status", "").lower(),
                            "start_date": p.get("createdAt"),
                            "compliance": "Unknown"
                        })
                        active.append(protocol_data)
                
                return {
                    "type": "protocols",
                    "title": "Health Optimization Protocols",
                    "data": {
                        "active": active,
                        "completed": completed
                    }
                }
        
        elif bucket_code == "health_device":
            # This doesn't need syncing - always return the same data
            return {
                "type": "health_device",
                "title": "Health Devices",
                "data": {
                    "devices": [
                        {
                            "name": "Apple Watch",
                            "type": "smartwatch",
                            "status": "connected",
                            "last_sync": datetime.utcnow().isoformat(),
                            "source": "Don't Die API"
                        }
                    ]
                }
            }
        
        # Default empty response
        return {
            "type": bucket_code,
            "title": bucket_code.replace("_", " ").title(),
            "data": {
                "message": "No data available for this section."
            }
        }

    async def update_checklist_status(self, session: AsyncSession, user_id: str, user_data: "DDUserData"):
        """Update checklist completion status based on actual data availability."""
        from sqlmodel import select
        from datetime import datetime
        
        # Define which bucket codes should be marked as completed based on data availability
        status_mapping = {
            "health_device": "completed",  # Always available since Apple Watch is connected
            "dd_score": "completed" if user_data.get_dd_scores() else "pending",
            "measurements": "completed" if user_data.get_measurements() else "pending", 
            "capabilities": "completed" if user_data.get_capabilities() else "pending",
            "biomarkers": "pending",  # Always pending since no biomarker data
            "protocols": "completed" if user_data.get_protocols() else "pending",
            "demographics": "pending"  # Always pending since no demographics data
        }
        
        # Update each checklist item
        for bucket_code, status in status_mapping.items():
            stmt = select(ChecklistItem).where(
                ChecklistItem.user_id == user_id,
                ChecklistItem.bucket_code == bucket_code
            )
            result = await session.execute(stmt)
            item = result.scalar_one_or_none()
            
            if item and item.status != status:
                item.status = status
                item.updated_at = datetime.utcnow()
                if status == "completed":
                    item.source = "Don't Die API"
                logger.info(f"Updated checklist item {bucket_code} to {status} for user {user_id}")
        
        await session.commit()
        logger.info(f"Updated checklist status for user {user_id}") 