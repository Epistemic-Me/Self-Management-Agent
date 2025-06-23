"""
Mock OpenAI Service for testing prompt functionality without requiring API key.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import asyncio
import random

logger = logging.getLogger(__name__)

class MockOpenAIService:
    """Mock implementation of OpenAI service for testing."""
    
    def __init__(self):
        self.default_model = "gpt-4o-mini"
    
    async def test_prompt(
        self,
        system_prompt: str,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Mock implementation that generates realistic responses based on the system prompt.
        """
        try:
            # Simulate API delay
            await asyncio.sleep(random.uniform(0.5, 2.0))
            
            # Generate a contextual response based on the prompt and message
            response = self._generate_mock_response(system_prompt, user_message, conversation_history)
            
            return {
                "success": True,
                "response": response,
                "metadata": {
                    "model": model or self.default_model,
                    "usage": {
                        "prompt_tokens": len(system_prompt.split()) + len(user_message.split()) + 50,
                        "completion_tokens": len(response.split()),
                        "total_tokens": len(system_prompt.split()) + len(user_message.split()) + len(response.split()) + 50
                    },
                    "timestamp": datetime.utcnow().isoformat(),
                    "finish_reason": "stop"
                }
            }
            
        except Exception as e:
            logger.error(f"Mock service error: {e}")
            return {
                "success": False,
                "error": f"Mock error: {str(e)}",
                "error_type": "mock_error"
            }
    
    def _generate_mock_response(
        self, 
        system_prompt: str, 
        user_message: str, 
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Generate a contextual mock response based on the system prompt and message."""
        
        # Analyze the system prompt for role and behavior
        prompt_lower = system_prompt.lower()
        message_lower = user_message.lower()
        
        # Customer Support Response
        if "customer support" in prompt_lower or "support assistant" in prompt_lower:
            if "login" in message_lower or "account" in message_lower:
                return """# Account Access - Support Response

I understand you're having trouble logging into your account. I'm here to help you get back in quickly.

## Solution Steps
1. Try resetting your password using the "Forgot Password" link
2. Check your email (including spam folder) for the reset instructions  
3. Clear your browser cache and cookies
4. Try logging in using an incognito/private browser window

## What to Expect
The password reset email should arrive within 5 minutes. If you don't receive it, I can send another reset link or help you verify your account details.

Is there anything specific about the login process that isn't working for you?"""
            
            elif "refund" in message_lower or "return" in message_lower:
                return """# Refund Request - Support Response

I'd be happy to help you with your refund request. Let me guide you through the process.

## Solution Steps
1. I'll need your order number to look up your purchase
2. I'll verify the item is eligible for return (within our 30-day policy)
3. I'll initiate the refund process once confirmed
4. You'll receive a return shipping label via email

## What to Expect
Refunds typically process within 3-5 business days after we receive the returned item. You'll get email notifications at each step.

Could you please provide your order number so I can get started?"""
            
            else:
                return f"""# Support Response

Thank you for contacting our support team! I'm here to help you with "{user_message}".

## Next Steps
To provide you with the best assistance, I may need some additional information. Please let me know:
- Any error messages you're seeing
- When the issue started
- What device/browser you're using

I'm committed to resolving this for you quickly and efficiently. What additional details can you share?"""
        
        # Code Reviewer Response  
        elif "code review" in prompt_lower or "software engineer" in prompt_lower:
            if "bug" in message_lower or "review" in message_lower:
                return """# Code Review - Function Analysis

I'd be happy to review your code for potential bugs and improvements.

## Review Process
To provide a thorough review, please share:
1. The specific function or code block you'd like reviewed
2. The programming language and framework
3. Any specific concerns or areas of focus
4. The expected behavior vs. actual behavior

## What I'll Check
- **Security**: Potential vulnerabilities and input validation
- **Performance**: Efficiency and optimization opportunities  
- **Maintainability**: Code structure and readability
- **Best Practices**: Framework-specific recommendations

Please paste your code and I'll provide detailed feedback with specific suggestions."""
            
            else:
                return f"""# Code Review Response

I'm ready to help with your code review request: "{user_message}".

## Review Scope
I can assist with:
- Bug identification and fixes
- Security vulnerability assessment
- Performance optimization
- Code structure improvements
- Best practices recommendations

Please share the code you'd like reviewed, along with any specific areas of concern, and I'll provide detailed analysis."""
        
        # Educational Tutor Response
        elif "tutor" in prompt_lower or "educational" in prompt_lower:
            if "explain" in message_lower or "help" in message_lower:
                topic = user_message.replace("explain", "").replace("help me understand", "").strip()
                return f"""# Learning: {topic.title() if topic else "Concept Explanation"}

Great question! I'm excited to help you understand this concept better.

## Key Concepts
Let me break this down into understandable parts that build on each other.

## Step-by-Step Explanation  
I'll walk you through this concept using examples and analogies that make it easier to grasp.

## Practice Opportunity
Once we cover the basics, I'll give you some practice questions to reinforce your understanding.

What specific aspect would you like me to start with? I want to make sure I explain things at the right level for you."""
            
            else:
                return f"""# Learning Session

I'm here to help you learn and understand "{user_message}".

## My Teaching Approach
- Break complex ideas into simple, manageable steps
- Use relatable examples and analogies
- Encourage questions and exploration
- Build confidence through positive reinforcement

## Getting Started
To provide the best explanation, let me know:
- Your current level of familiarity with this topic
- Any specific aspects you're struggling with
- How you learn best (examples, visuals, step-by-step, etc.)

I'm here to guide you through this learning journey. What would you like to explore first?"""
        
        # Generic helpful response
        else:
            return f"""Thank you for your message: "{user_message}".

Based on my instructions, I'm designed to be helpful and provide accurate information while maintaining a professional tone.

To better assist you, could you provide a bit more context about what you're looking for? I'm here to help and want to make sure I give you the most relevant and useful response.

What specific information or assistance can I provide for you today?"""
    
    async def validate_prompt(self, system_prompt: str) -> Dict[str, Any]:
        """Mock prompt validation with realistic scoring."""
        
        try:
            # Simulate validation delay
            await asyncio.sleep(random.uniform(0.3, 1.0))
            
            validation_score = 100
            issues = []
            
            # Check prompt length
            if len(system_prompt) < 100:
                validation_score -= 20
                issues.append("Prompt is too short - may not provide enough guidance")
            elif len(system_prompt) > 2000:
                validation_score -= 10
                issues.append("Prompt is very long - may be too complex")
            
            # Check for key components
            prompt_lower = system_prompt.lower()
            
            if "role" not in prompt_lower and "objective" not in prompt_lower:
                validation_score -= 15
                issues.append("Missing clear role definition")
            
            if "should" not in prompt_lower:
                validation_score -= 10
                issues.append("Could benefit from explicit behavioral guidelines")
            
            if "never" not in prompt_lower or "don't" not in prompt_lower:
                validation_score -= 10
                issues.append("Consider adding safety guidelines about what not to do")
            
            # Generate test response
            test_response = self._generate_mock_response(
                system_prompt, 
                "Hello! Can you briefly explain what you're designed to help with?"
            )
            
            return {
                "success": True,
                "validation_score": max(0, validation_score),
                "issues": issues,
                "test_response": test_response,
                "metadata": {
                    "model": self.default_model,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Mock validation error: {e}")
            return {
                "success": False,
                "error": f"Mock validation error: {str(e)}",
                "error_type": "mock_error"
            }

# Create mock service instance
mock_openai_service = MockOpenAIService()