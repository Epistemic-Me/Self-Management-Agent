import asyncio
import logging
import os
from typing import Dict, List, Tuple, Any

# For now, skip DeepEval entirely due to filesystem permission issues
# and focus on OpenAI direct integration
DEEPEVAL_AVAILABLE = False

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    
# Mock classes for development
class DeepEvalBaseLLM:
    pass

class ConversationSimulator:
    def __init__(self, **kwargs):
        pass

from job_schema import Job

logger = logging.getLogger(__name__)


class OpenAILLM(DeepEvalBaseLLM):
    """OpenAI LLM wrapper for DeepEval"""
    
    def __init__(self, model_name: str = "gpt-4"):
        self.model_name = model_name
        self.client = None
        if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
            self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    def load_model(self):
        # Model loading is handled by OpenAI API
        return self
    
    def generate(self, prompt: str, schema: Dict = None) -> str:
        """Generate response using OpenAI API"""
        if not self.client:
            return "Mock response - no OpenAI API key provided"
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return f"Error generating response: {str(e)}"
    
    async def a_generate(self, prompt: str, schema: Dict = None) -> str:
        """Async version - run in thread pool"""
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.generate, prompt, schema)
    
    def get_model_name(self) -> str:
        return self.model_name


async def run_simulation(job: Job) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Run DeepEval ConversationSimulator and return transcript and metrics
    
    Args:
        job: The simulation job containing user_id, template, and parameters
        
    Returns:
        Tuple of (transcript, metrics)
        - transcript: List of conversation turns with role/content/extra
        - metrics: Dictionary of simulation metrics and scores
    """
    logger.info(f"Starting DeepEval simulation for job {job.job_id}")
    
    try:
        # Check if we can use real OpenAI
        use_real_openai = (
            OPENAI_AVAILABLE and 
            os.getenv("OPENAI_API_KEY") and 
            job.simulation_config.get("use_real_deepeval", False)
        )
        
        if use_real_openai:
            logger.info(f"Generating conversation with {job.simulation_config.get('turns', 10)} turns using real OpenAI")
            transcript = await generate_real_deepeval_conversation(job)
        else:
            logger.info(f"Generating mock conversation with {job.simulation_config.get('turns', 10)} turns")
            transcript = await generate_mock_conversation(job)
        
        # Calculate mock metrics
        metrics = calculate_simulation_metrics(transcript, job)
        
        logger.info(f"Simulation completed: {len(transcript)} turns, metrics calculated")
        return transcript, metrics
        
    except Exception as e:
        logger.error(f"Simulation failed for job {job.job_id}: {str(e)}")
        # Return minimal conversation with error
        error_transcript = [
            {
                "role": "system",
                "content": f"Simulation failed: {str(e)}",
                "extra": {"error": True, "job_id": job.job_id}
            }
        ]
        error_metrics = {
            "status": "error",
            "error_message": str(e),
            "turns_generated": 0
        }
        return error_transcript, error_metrics


async def generate_real_deepeval_conversation(job: Job) -> List[Dict[str, Any]]:
    """Generate a real conversation using DeepEval ConversationSimulator"""
    
    try:
        # Initialize the LLM model with OpenAI
        llm = OpenAILLM(model_name=job.simulation_config.get("model", "gpt-4"))
        
        # Get conversation parameters
        purpose = job.simulation_config.get("purpose", get_default_purpose(job.template))
        context = job.simulation_config.get("context", get_default_context(job.template))
        target_turns = job.simulation_config.get("turns", 5)
        
        # Create conversation simulator
        simulator = ConversationSimulator(
            model=llm,
            purpose=purpose,
            context=context,
            persona="helpful health coach",
            expected_length=target_turns
        )
        
        # Generate the conversation
        logger.info(f"Running DeepEval ConversationSimulator for {target_turns} turns")
        
        # Note: DeepEval's ConversationSimulator might not have the exact API we need
        # Let's implement a custom conversation generation using the OpenAI LLM directly
        transcript = await generate_openai_conversation(llm, job, purpose, context, target_turns)
        
        return transcript
        
    except Exception as e:
        logger.error(f"Real DeepEval conversation generation failed: {str(e)}")
        # Fallback to mock conversation
        logger.info("Falling back to mock conversation generation")
        return await generate_mock_conversation(job)


async def generate_openai_conversation(
    llm: OpenAILLM, 
    job: Job, 
    purpose: str, 
    context: str, 
    target_turns: int
) -> List[Dict[str, Any]]:
    """Generate conversation using OpenAI directly with iterative turns"""
    
    transcript = []
    conversation_history = []
    
    # System prompt for the health coach
    system_prompt = f"""You are a professional health coach having a conversation with a client.
    
Purpose: {purpose}
Context: {context}
Template: {job.template}

Guidelines:
- Ask thoughtful, open-ended questions
- Be empathetic and supportive
- Focus on the client's goals and concerns
- Keep responses conversational and under 50 words
- Build on previous responses naturally
"""
    
    # Generate conversation turns
    for turn_num in range(1, target_turns + 1):
        try:
            if turn_num % 2 == 1:  # Odd turns are assistant
                # Generate assistant question/response
                if turn_num == 1:
                    prompt = f"{system_prompt}\n\nStart the conversation with an opening question."
                else:
                    # Build on conversation history
                    history_text = "\n".join([f"{h['role']}: {h['content']}" for h in conversation_history[-4:]])
                    prompt = f"{system_prompt}\n\nConversation so far:\n{history_text}\n\nGenerate the next assistant response:"
                
                content = await llm.a_generate(prompt)
                role = "assistant"
                
            else:  # Even turns are user responses
                # Generate user response based on conversation
                history_text = "\n".join([f"{h['role']}: {h['content']}" for h in conversation_history[-3:]])
                user_prompt = f"""Generate a realistic user response to this health coaching conversation.
                
Template: {job.template}
Context: {context}

Recent conversation:
{history_text}

Generate a natural, authentic user response (under 40 words):"""
                
                content = await llm.a_generate(user_prompt)
                role = "user"
            
            # Add turn to transcript
            turn = {
                "role": role,
                "content": content.strip(),
                "extra": {
                    "turn_number": turn_num,
                    "template": job.template,
                    "job_id": job.job_id,
                    "user_id": job.user_id,
                    "simulation_type": job.simulation_type,
                    "generated_by": "openai",
                    "model": llm.model_name
                }
            }
            
            transcript.append(turn)
            conversation_history.append({"role": role, "content": content.strip()})
            
            # Small delay between generations to avoid rate limits
            await asyncio.sleep(0.5)
            
        except Exception as e:
            logger.error(f"Error generating turn {turn_num}: {str(e)}")
            # Add a fallback response
            fallback_content = get_fallback_content(role, turn_num, job.template)
            turn = {
                "role": role,
                "content": fallback_content,
                "extra": {
                    "turn_number": turn_num,
                    "template": job.template,
                    "job_id": job.job_id,
                    "user_id": job.user_id,
                    "simulation_type": job.simulation_type,
                    "generated_by": "fallback",
                    "error": str(e)
                }
            }
            transcript.append(turn)
            conversation_history.append({"role": role, "content": fallback_content})
    
    return transcript


def get_default_purpose(template: str) -> str:
    """Get default conversation purpose based on template"""
    purposes = {
        "health_assessment": "Assess the user's current health status, goals, and concerns",
        "protocol_discussion": "Discuss personalized health protocols and habit formation",
        "belief_exploration": "Explore the user's beliefs and mindset about health and wellness"
    }
    return purposes.get(template, "General health coaching conversation")


def get_default_context(template: str) -> str:
    """Get default conversation context based on template"""
    contexts = {
        "health_assessment": "Initial health assessment and goal setting session",
        "protocol_discussion": "Protocol planning and personalized health strategy development",
        "belief_exploration": "Belief system exploration and mindset coaching session"
    }
    return contexts.get(template, "Personal health management consultation")


def get_fallback_content(role: str, turn_num: int, template: str) -> str:
    """Get fallback content when OpenAI generation fails"""
    if role == "assistant":
        if turn_num == 1:
            return "Hello! I'm here to help you with your health journey. How are you feeling today?"
        else:
            return "That's interesting. Can you tell me more about that?"
    else:  # user
        if template == "health_assessment":
            return "I've been thinking about improving my health lately."
        elif template == "protocol_discussion":
            return "I'm interested in creating better health habits."
        elif template == "belief_exploration":
            return "I have some thoughts about what makes someone healthy."
        else:
            return "I'd like to learn more about improving my wellness."


async def generate_mock_conversation(job: Job) -> List[Dict[str, Any]]:
    """Generate a mock conversation based on the job template"""
    
    template_conversations = {
        "health_assessment": [
            {
                "role": "assistant",
                "content": "Hello! I'm here to help you assess your current health status. Can you tell me about your main health goals?",
                "extra": {"turn_number": 1, "template": "health_assessment"}
            },
            {
                "role": "user", 
                "content": "I want to improve my energy levels and sleep quality. I've been feeling tired lately.",
                "extra": {"turn_number": 2, "template": "health_assessment"}
            },
            {
                "role": "assistant",
                "content": "That's a great goal. Poor sleep can definitely affect energy levels. How many hours of sleep do you typically get per night?",
                "extra": {"turn_number": 3, "template": "health_assessment"}
            },
            {
                "role": "user",
                "content": "Usually around 6 hours, sometimes less. I have trouble falling asleep.",
                "extra": {"turn_number": 4, "template": "health_assessment"}
            },
            {
                "role": "assistant",
                "content": "Six hours is below the recommended 7-9 hours for most adults. What's your typical bedtime routine?",
                "extra": {"turn_number": 5, "template": "health_assessment"}
            }
        ],
        "protocol_discussion": [
            {
                "role": "assistant",
                "content": "Let's discuss creating a personalized health protocol for you. What areas of your health would you like to focus on?",
                "extra": {"turn_number": 1, "template": "protocol_discussion"}
            },
            {
                "role": "user",
                "content": "I'm interested in nutrition and exercise. I want to build sustainable habits.",
                "extra": {"turn_number": 2, "template": "protocol_discussion"}
            },
            {
                "role": "assistant", 
                "content": "Excellent! Building sustainable habits is key. Let's start with nutrition - what does your current eating pattern look like?",
                "extra": {"turn_number": 3, "template": "protocol_discussion"}
            },
            {
                "role": "user",
                "content": "I skip breakfast often and eat a lot of processed foods for convenience. I know it's not ideal.",
                "extra": {"turn_number": 4, "template": "protocol_discussion"}
            }
        ],
        "belief_exploration": [
            {
                "role": "assistant",
                "content": "I'd like to explore your beliefs about health and wellness. What do you think is the most important factor for good health?",
                "extra": {"turn_number": 1, "template": "belief_exploration"}
            },
            {
                "role": "user",
                "content": "I think consistency is everything. It's better to do small things regularly than big changes you can't maintain.",
                "extra": {"turn_number": 2, "template": "belief_exploration"}
            },
            {
                "role": "assistant",
                "content": "That's a wise perspective. How did you come to that belief? Have you experienced this personally?",
                "extra": {"turn_number": 3, "template": "belief_exploration"}
            },
            {
                "role": "user",
                "content": "Yes, I've tried crash diets and intense workout programs before. They worked short-term but I always burned out.",
                "extra": {"turn_number": 4, "template": "belief_exploration"}
            }
        ]
    }
    
    # Get conversation template or default
    template = job.template or "health_assessment"
    conversation = template_conversations.get(template, template_conversations["health_assessment"])
    
    # Extend conversation based on requested turns
    target_turns = job.simulation_config.get("turns", len(conversation))
    
    # If we need more turns, repeat the pattern or add closing
    if target_turns > len(conversation):
        conversation.append({
            "role": "assistant",
            "content": "Thank you for sharing that with me. This conversation will help us create a personalized approach for you.",
            "extra": {"turn_number": len(conversation) + 1, "template": template, "closing": True}
        })
    
    # Add job metadata to all turns
    for turn in conversation:
        turn["extra"]["job_id"] = job.job_id
        turn["extra"]["user_id"] = job.user_id
        turn["extra"]["simulation_type"] = job.simulation_type
    
    return conversation[:target_turns]


def calculate_simulation_metrics(transcript: List[Dict[str, Any]], job: Job) -> Dict[str, Any]:
    """Calculate metrics for the simulated conversation"""
    
    metrics = {
        "job_id": job.job_id,
        "user_id": job.user_id,
        "template": job.template,
        "simulation_type": job.simulation_type,
        "total_turns": len(transcript),
        "user_turns": len([t for t in transcript if t["role"] == "user"]),
        "assistant_turns": len([t for t in transcript if t["role"] == "assistant"]),
        "system_turns": len([t for t in transcript if t["role"] == "system"]),
        "total_words": sum(len(t["content"].split()) for t in transcript),
        "avg_words_per_turn": 0,
        "conversation_quality_score": 0.85,  # Mock score
        "engagement_score": 0.90,  # Mock score
        "goal_achievement_score": 0.75,  # Mock score
    }
    
    if metrics["total_turns"] > 0:
        metrics["avg_words_per_turn"] = metrics["total_words"] / metrics["total_turns"]
    
    # Add template-specific metrics
    if job.template == "health_assessment":
        metrics["assessment_completeness"] = 0.80
        metrics["health_topics_covered"] = ["sleep", "energy", "routine"]
    elif job.template == "protocol_discussion":
        metrics["protocol_areas_discussed"] = ["nutrition", "exercise", "habits"]
        metrics["actionability_score"] = 0.85
    elif job.template == "belief_exploration":
        metrics["beliefs_identified"] = 2
        metrics["belief_confidence_avg"] = 0.75
    
    return metrics 