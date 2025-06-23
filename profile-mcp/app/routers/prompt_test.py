"""
Prompt Testing API Router

Handles real-time prompt testing with OpenAI integration.
"""

from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging

import os
from dotenv import load_dotenv

# Initialize logger first
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(dotenv_path='../../.env')

# Initialize real OpenAI service - no fallback to mock
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key or not openai_api_key.startswith("sk-") or len(openai_api_key) <= 20:
    logger.error("No valid OpenAI API key found. Please set OPENAI_API_KEY environment variable.")
    raise ValueError("OPENAI_API_KEY is required for prompt testing functionality")

try:
    from app.services.openai_service import openai_service
    ai_service = openai_service
    logger.info("Successfully initialized OpenAI service")
except Exception as e:
    logger.error(f"Failed to initialize OpenAI service: {e}")
    raise RuntimeError(f"OpenAI service initialization failed: {e}")

router = APIRouter(prefix="/api/prompt-test", tags=["prompt-testing"])

# Request/Response Models
class TestMessage(BaseModel):
    role: str  # "user" | "assistant" 
    content: str
    timestamp: Optional[str] = None

class PromptTestRequest(BaseModel):
    system_prompt: str
    user_message: str
    conversation_history: List[TestMessage] = []
    model: Optional[str] = None

class PromptTestResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    error: Optional[str] = None
    error_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class PromptValidationRequest(BaseModel):
    system_prompt: str

class PromptValidationResponse(BaseModel):
    success: bool
    validation_score: Optional[int] = None
    issues: List[str] = []
    test_response: Optional[str] = None
    error: Optional[str] = None
    error_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@router.post("/test", response_model=PromptTestResponse)
async def test_prompt(request: PromptTestRequest) -> PromptTestResponse:
    """
    Test a system prompt with a user message and get AI response.
    """
    try:
        # Validate inputs
        if not request.system_prompt.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="System prompt cannot be empty"
            )
        
        if not request.user_message.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User message cannot be empty"
            )
        
        # Convert conversation history to the expected format
        conversation_history = [
            {
                "role": msg.role,
                "content": msg.content
            }
            for msg in request.conversation_history
        ]
        
        # Call AI service (real or mock)
        result = await ai_service.test_prompt(
            system_prompt=request.system_prompt,
            user_message=request.user_message,
            conversation_history=conversation_history,
            model=request.model
        )
        
        return PromptTestResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in test_prompt: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occurred during prompt testing"
        )

@router.post("/validate", response_model=PromptValidationResponse)
async def validate_prompt(request: PromptValidationRequest) -> PromptValidationResponse:
    """
    Validate a system prompt by testing it with a standard query.
    """
    try:
        if not request.system_prompt.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="System prompt cannot be empty"
            )
        
        result = await ai_service.validate_prompt(request.system_prompt)
        
        return PromptValidationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in validate_prompt: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error occurred during prompt validation"
        )

@router.get("/health")
async def health_check():
    """
    Health check endpoint for prompt testing service.
    """
    try:
        # Test if AI service is accessible
        test_result = await ai_service.test_prompt(
            system_prompt="You are a helpful assistant.",
            user_message="Hello"
        )
        
        return {
            "status": "healthy" if test_result["success"] else "degraded",
            "service": "prompt-testing",
            "openai_accessible": test_result["success"]
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "prompt-testing",
            "error": str(e)
        }