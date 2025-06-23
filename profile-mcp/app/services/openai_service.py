"""
OpenAI Service for handling chat completions and prompt testing.
"""

import os
import openai
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from dotenv import load_dotenv

# Load environment variables from project root
load_dotenv(dotenv_path='../../.env')

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.client = openai.OpenAI(api_key=api_key)
        self.default_model = "gpt-4o-mini"  # Cost-effective for testing
    
    async def test_prompt(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Test a system prompt with a user message and return the AI response.
        
        Args:
            system_prompt: The system prompt to test
            user_message: The user's test message
            conversation_history: Previous messages in the conversation
            model: OpenAI model to use (defaults to gpt-4o-mini)
            
        Returns:
            Dict containing the response and metadata
        """
        try:
            # Build messages array
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history:
                    if msg.get("role") in ["user", "assistant"]:
                        messages.append({
                            "role": msg["role"],
                            "content": msg["content"]
                        })
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=model or self.default_model,
                messages=messages,
                max_tokens=1000,  # Reasonable limit for testing
                temperature=0.7,  # Balanced creativity
                stream=False
            )
            
            # Extract response content
            assistant_message = response.choices[0].message.content
            
            return {
                "success": True,
                "response": assistant_message,
                "metadata": {
                    "model": response.model,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens,
                        "completion_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    },
                    "timestamp": datetime.utcnow().isoformat(),
                    "finish_reason": response.choices[0].finish_reason
                }
            }
            
        except openai.APIError as e:
            logger.error(f"OpenAI API error: {e}")
            return {
                "success": False,
                "error": f"API Error: {str(e)}",
                "error_type": "api_error"
            }
        
        except openai.RateLimitError as e:
            logger.error(f"OpenAI rate limit error: {e}")
            return {
                "success": False,
                "error": "Rate limit exceeded. Please try again in a moment.",
                "error_type": "rate_limit"
            }
        
        except openai.AuthenticationError as e:
            logger.error(f"OpenAI authentication error: {e}")
            return {
                "success": False,
                "error": "Authentication failed. Please check your API key.",
                "error_type": "auth_error"
            }
        
        except Exception as e:
            logger.error(f"Unexpected error in test_prompt: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "error_type": "unknown"
            }
    
    async def validate_prompt(self, system_prompt: str) -> Dict[str, Any]:
        """
        Validate a system prompt by testing it with a simple query.
        
        Args:
            system_prompt: The system prompt to validate
            
        Returns:
            Dict containing validation results
        """
        validation_message = "Hello! Can you briefly explain what you're designed to help with?"
        
        result = await self.test_prompt(
            system_prompt=system_prompt,
            user_message=validation_message
        )
        
        if result["success"]:
            response_length = len(result["response"])
            
            # Basic validation checks
            validation_score = 100
            issues = []
            
            # Check response length (should be reasonable)
            if response_length < 50:
                validation_score -= 20
                issues.append("Response too short - prompt may not be providing enough guidance")
            elif response_length > 1000:
                validation_score -= 10
                issues.append("Response very long - prompt may be too verbose")
            
            # Check if response seems relevant
            response_lower = result["response"].lower()
            relevant_keywords = ["help", "assist", "designed", "purpose", "role"]
            if not any(keyword in response_lower for keyword in relevant_keywords):
                validation_score -= 30
                issues.append("Response doesn't clearly explain the assistant's purpose")
            
            return {
                "success": True,
                "validation_score": max(0, validation_score),
                "issues": issues,
                "test_response": result["response"],
                "metadata": result.get("metadata", {})
            }
        else:
            return {
                "success": False,
                "error": result["error"],
                "error_type": result.get("error_type", "unknown")
            }

# Global service instance
openai_service = OpenAIService()