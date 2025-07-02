"""
Storage service for conversation traces and evaluation data
"""
import logging
from typing import Optional, Dict, Any
import json
import redis.asyncio as redis
from datetime import datetime

from app.core.config import settings
from app.models.chat import ConversationTrace

logger = logging.getLogger(__name__)


class ConversationStorage:
    """Store and retrieve conversation traces"""
    
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL)
        
    async def get_trace(self, session_id: str) -> Optional[ConversationTrace]:
        """Get conversation trace by session ID"""
        try:
            data = await self.redis.get(f"trace:{session_id}")
            if data:
                trace_dict = json.loads(data)
                return ConversationTrace(**trace_dict)
            return None
        except Exception as e:
            logger.error(f"Error getting trace: {str(e)}")
            return None
    
    async def get_or_create_trace(
        self,
        session_id: str,
        user_id: str
    ) -> ConversationTrace:
        """Get existing trace or create new one"""
        trace = await self.get_trace(session_id)
        if trace:
            return trace
            
        # Create new trace
        trace = ConversationTrace(
            session_id=session_id,
            user_id=user_id
        )
        await self.save_trace(trace)
        return trace
    
    async def save_trace(self, trace: ConversationTrace) -> None:
        """Save conversation trace"""
        try:
            data = trace.model_dump_json()
            await self.redis.set(
                f"trace:{trace.session_id}",
                data,
                ex=86400 * 7  # 7 days expiry
            )
            
            # Also save for evaluation access
            await self.redis.set(
                f"evaluation:{trace.trace_id}",
                trace.to_evaluation_format(),
                ex=86400 * 30  # 30 days for evaluation
            )
            
        except Exception as e:
            logger.error(f"Error saving trace: {str(e)}")
    
    async def get_traces_for_evaluation(
        self,
        user_id: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Get traces formatted for evaluation"""
        try:
            pattern = f"evaluation:*"
            keys = []
            
            async for key in self.redis.scan_iter(match=pattern):
                keys.append(key)
                if len(keys) >= limit:
                    break
            
            traces = []
            for key in keys:
                data = await self.redis.get(key)
                if data:
                    trace_data = json.loads(data)
                    if not user_id or trace_data.get("user_id") == user_id:
                        traces.append(trace_data)
            
            return {
                "traces": traces,
                "count": len(traces),
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting evaluation traces: {str(e)}")
            return {"traces": [], "count": 0}