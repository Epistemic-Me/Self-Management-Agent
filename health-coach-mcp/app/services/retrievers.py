"""
Retrievers for integrating with Self-Management Agent services
"""
import logging
from typing import Dict, List, Optional, Any
import httpx
from datetime import datetime, timedelta

from app.core.config import settings
from app.core.hierarchy import Category

logger = logging.getLogger(__name__)


class ProfileRetriever:
    """Retrieve user profile data from profile-mcp"""
    
    def __init__(self):
        self.base_url = settings.PROFILE_MCP_URL
        self.client = httpx.AsyncClient(timeout=10.0)
        
    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile summary"""
        try:
            response = await self.client.get(
                f"{self.base_url}/users/{user_id}/profile",
                headers={"Authorization": f"Bearer {settings.API_KEY}"}
            )
            
            if response.status_code == 200:
                profile = response.json()
                return {
                    "user_id": user_id,
                    "demographics": profile.get("demographics", {}),
                    "preferences": profile.get("preferences", {}),
                    "health_goals": profile.get("health_goals", []),
                    "summary": self._summarize_profile(profile)
                }
            else:
                logger.warning(f"Failed to get profile for user {user_id}: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error retrieving profile: {str(e)}")
            return None
    
    def _summarize_profile(self, profile: Dict) -> str:
        """Create a brief summary of user profile"""
        parts = []
        
        if demo := profile.get("demographics"):
            age = demo.get("age")
            if age:
                parts.append(f"{age} years old")
                
        if goals := profile.get("health_goals"):
            parts.append(f"Goals: {', '.join(goals[:2])}")
            
        return ". ".join(parts) if parts else "No profile summary available"


class BeliefRetriever:
    """Retrieve relevant beliefs from em-mcp"""
    
    def __init__(self):
        self.base_url = settings.EM_MCP_URL
        self.client = httpx.AsyncClient(timeout=10.0)
        
    async def get_relevant_beliefs(
        self,
        user_id: str,
        category: Category
    ) -> List[Dict[str, Any]]:
        """Get beliefs relevant to the health category"""
        try:
            # Map health categories to belief topics
            topic_map = {
                Category.SLEEP: "sleep_recovery",
                Category.NUTRITION: "diet_nutrition",
                Category.EXERCISE: "physical_activity"
            }
            
            topic = topic_map.get(category, "health")
            
            response = await self.client.get(
                f"{self.base_url}/beliefs",
                params={
                    "user_id": user_id,
                    "topic": topic,
                    "limit": 5
                },
                headers={"Authorization": f"Bearer {settings.API_KEY}"}
            )
            
            if response.status_code == 200:
                beliefs = response.json().get("beliefs", [])
                return [
                    {
                        "id": b.get("id"),
                        "content": b.get("content"),
                        "type": b.get("type"),
                        "confidence": b.get("confidence", 0.5),
                        "created_at": b.get("created_at")
                    }
                    for b in beliefs
                ]
            else:
                logger.warning(f"Failed to get beliefs: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error retrieving beliefs: {str(e)}")
            return []


class HealthDataRetriever:
    """Retrieve health data from dd-mcp"""
    
    def __init__(self):
        self.base_url = settings.DD_MCP_URL
        self.client = httpx.AsyncClient(timeout=10.0)
        
    async def get_recent_data(
        self,
        user_id: str,
        category: Category,
        days: int = 7
    ) -> Optional[Dict[str, Any]]:
        """Get recent health data for the category"""
        try:
            # Map categories to biomarker types
            biomarker_map = {
                Category.SLEEP: ["sleep_duration", "sleep_quality", "hrv"],
                Category.NUTRITION: ["glucose", "weight", "body_fat"],
                Category.EXERCISE: ["steps", "active_minutes", "vo2_max"]
            }
            
            biomarkers = biomarker_map.get(category, [])
            
            response = await self.client.get(
                f"{self.base_url}/biomarkers",
                params={
                    "user_id": user_id,
                    "types": ",".join(biomarkers),
                    "start_date": (datetime.utcnow() - timedelta(days=days)).isoformat(),
                    "end_date": datetime.utcnow().isoformat()
                },
                headers={"Authorization": f"Bearer {settings.API_KEY}"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "biomarkers": data.get("biomarkers", []),
                    "summary": self._summarize_health_data(data, category),
                    "trends": data.get("trends", {})
                }
            else:
                logger.warning(f"Failed to get health data: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error retrieving health data: {str(e)}")
            return None
    
    def _summarize_health_data(self, data: Dict, category: Category) -> str:
        """Create a brief summary of health data"""
        biomarkers = data.get("biomarkers", [])
        
        if not biomarkers:
            return "No recent health data available"
            
        summaries = []
        
        for biomarker in biomarkers[:3]:  # Limit to top 3
            name = biomarker.get("name")
            value = biomarker.get("latest_value")
            unit = biomarker.get("unit", "")
            trend = biomarker.get("trend", "stable")
            
            if name and value is not None:
                summaries.append(f"{name}: {value}{unit} ({trend})")
                
        return "; ".join(summaries) if summaries else "Limited health data available"


class MemoryRetriever:
    """Retrieve from conversation memory and history"""
    
    def __init__(self):
        self.base_url = settings.PROFILE_MCP_URL
        self.client = httpx.AsyncClient(timeout=10.0)
        
    async def get_conversation_context(
        self,
        session_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get recent conversation context"""
        try:
            response = await self.client.get(
                f"{self.base_url}/conversations/{session_id}/messages",
                params={"limit": limit},
                headers={"Authorization": f"Bearer {settings.API_KEY}"}
            )
            
            if response.status_code == 200:
                messages = response.json().get("messages", [])
                return messages
            else:
                return []
                
        except Exception as e:
            logger.error(f"Error retrieving conversation context: {str(e)}")
            return []