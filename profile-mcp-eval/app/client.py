import logging
from typing import Dict, Any, Optional, List
from uuid import UUID

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class ProfileMCPClient:
    """HTTP client wrapper for profile-mcp API"""
    
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def start_conversation(
        self, 
        user_id: str, 
        meta: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Start a new conversation in profile-mcp
        
        Args:
            user_id: The user ID
            meta: Optional metadata for the conversation
            
        Returns:
            Conversation ID
        """
        logger.info(f"Starting conversation for user {user_id}")
        
        payload = {
            "user_id": user_id,
            "meta": meta or {}
        }
        
        try:
            response = await self.client.post("/startConversation", json=payload)
            response.raise_for_status()
            
            result = response.json()
            conversation_id = result["data"]["conversation_id"]
            
            logger.info(f"Started conversation {conversation_id} for user {user_id}")
            return conversation_id
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error starting conversation: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error starting conversation: {str(e)}")
            raise
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def append_turn(
        self,
        conversation_id: str,
        role: str,
        content: str,
        extra_json: Optional[Dict[str, Any]] = None,
        close_conversation: bool = False
    ) -> None:
        """
        Append a turn to an existing conversation
        
        Args:
            conversation_id: The conversation ID
            role: Turn role (user, assistant, system)
            content: Turn content
            extra_json: Optional extra metadata
            close_conversation: Whether to close the conversation
        """
        logger.debug(f"Appending {role} turn to conversation {conversation_id}")
        
        payload = {
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "extra_json": extra_json or {},
            "close_conversation": close_conversation
        }
        
        try:
            response = await self.client.post("/appendTurn", json=payload)
            response.raise_for_status()
            
            logger.debug(f"Turn appended to conversation {conversation_id}")
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error appending turn: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error appending turn: {str(e)}")
            raise
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def get_conversation(self, conversation_id: str) -> Dict[str, Any]:
        """
        Retrieve a full conversation with all turns
        
        Args:
            conversation_id: The conversation ID
            
        Returns:
            Conversation data with turns
        """
        logger.debug(f"Retrieving conversation {conversation_id}")
        
        try:
            response = await self.client.get(f"/getConversation?conversation_id={conversation_id}")
            response.raise_for_status()
            
            result = response.json()
            return result["data"]
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error getting conversation: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error getting conversation: {str(e)}")
            raise
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def list_conversations(
        self, 
        user_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        List conversations with optional user filtering
        
        Args:
            user_id: Optional user ID filter
            limit: Maximum number of conversations to return
            offset: Pagination offset
            
        Returns:
            List of conversation data
        """
        logger.debug(f"Listing conversations for user {user_id}")
        
        params = {
            "limit": limit,
            "offset": offset
        }
        if user_id:
            params["user_id"] = user_id
        
        try:
            response = await self.client.get("/listConversations", params=params)
            response.raise_for_status()
            
            result = response.json()
            return result["data"]["conversations"]
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error listing conversations: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error listing conversations: {str(e)}")
            raise
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def start_dialectic(
        self,
        user_id: str,
        self_model_id: Optional[str] = None,
        learning_objective: Optional[Dict[str, Any]] = None,
        conversation_id: Optional[str] = None
    ) -> str:
        """
        Start a new dialectic session
        
        Args:
            user_id: The user ID
            self_model_id: Optional self model ID
            learning_objective: Optional learning objective
            conversation_id: Optional conversation to link to
            
        Returns:
            Dialectic ID
        """
        logger.info(f"Starting dialectic for user {user_id}")
        
        payload = {
            "user_id": user_id,
            "self_model_id": self_model_id,
            "learning_objective": learning_objective,
            "conversation_id": conversation_id
        }
        
        try:
            response = await self.client.post("/startDialectic", json=payload)
            response.raise_for_status()
            
            result = response.json()
            dialectic_id = result["data"]["dialectic_id"]
            
            logger.info(f"Started dialectic {dialectic_id} for user {user_id}")
            return dialectic_id
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error starting dialectic: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error starting dialectic: {str(e)}")
            raise
    
    async def health_check(self) -> bool:
        """Check if profile-mcp service is healthy"""
        try:
            # Try multiple endpoints to check if service is healthy
            endpoints_to_try = ["/health", "/docs", "/openapi.json"]
            
            for endpoint in endpoints_to_try:
                try:
                    response = await self.client.get(endpoint)
                    if response.status_code == 200:
                        return True
                except Exception:
                    continue
            
            return False
        except Exception:
            return False
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose() 