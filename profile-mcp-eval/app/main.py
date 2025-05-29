import asyncio
import json
import logging
import os
from typing import Optional

import redis.asyncio as redis
from tenacity import retry, stop_after_attempt, wait_exponential

from client import ProfileMCPClient
from deepeval_runner import run_simulation
from job_schema import Job

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment configuration
JOB_QUEUE_URL = os.getenv("JOB_QUEUE_URL", "redis://redis:6379/1")
PROFILE_MCP_BASE = os.getenv("PROFILE_MCP_BASE", "http://profile-mcp:8010")
TOKEN = os.getenv("TOKEN", "SIM_WORKER_TOKEN")
POLL_SEC = int(os.getenv("POLL_SEC", "5"))


class SimulationWorker:
    def __init__(self):
        self.redis_client = redis.from_url(JOB_QUEUE_URL, decode_responses=True)
        self.profile_client = ProfileMCPClient(PROFILE_MCP_BASE, TOKEN)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def process_job(self, job: Job) -> None:
        """Process a single simulation job with retry logic"""
        logger.info(f"Processing job {job.job_id} for user {job.user_id}")
        
        try:
            # Run DeepEval simulation
            transcript, metrics = await run_simulation(job)
            logger.info(f"Simulation completed for job {job.job_id}, {len(transcript)} turns generated")
            
            # Start conversation in profile-mcp
            conversation_meta = {
                "sim": True,
                "template": job.template,
                "job_id": job.job_id,
                "simulation_type": job.simulation_type
            }
            conversation_id = await self.profile_client.start_conversation(
                job.user_id, 
                meta=conversation_meta
            )
            logger.info(f"Created conversation {conversation_id} for job {job.job_id}")
            
            # Add all transcript turns
            for turn in transcript:
                await self.profile_client.append_turn(
                    conversation_id=conversation_id,
                    role=turn["role"],
                    content=turn["content"],
                    extra_json=turn.get("extra", {})
                )
            
            # Add metrics as system turn
            await self.profile_client.append_turn(
                conversation_id=conversation_id,
                role="system",
                content="[DeepEval Simulation Metrics]",
                extra_json={"metrics": metrics}
            )
            
            # Close the conversation
            await self.profile_client.append_turn(
                conversation_id=conversation_id,
                role="system", 
                content="Simulation completed",
                extra_json={},
                close_conversation=True
            )
            
            logger.info(f"Job {job.job_id} completed successfully")
            
        except Exception as e:
            logger.error(f"Failed to process job {job.job_id}: {str(e)}")
            raise
    
    async def poll_jobs(self) -> None:
        """Main polling loop for simulation jobs"""
        logger.info("Starting simulation worker poll loop...")
        
        while True:
            try:
                # Blocking pop from Redis queue with timeout
                result = await self.redis_client.blpop("simulation_jobs", timeout=POLL_SEC)
                
                if result:
                    queue_name, job_json = result
                    logger.info(f"Received job from queue: {queue_name}")
                    
                    try:
                        # Parse job from JSON
                        job = Job.model_validate_json(job_json)
                        await self.process_job(job)
                        
                    except Exception as e:
                        logger.error(f"Failed to process job: {str(e)}")
                        # Could implement dead letter queue here
                        continue
                        
                else:
                    logger.debug("No jobs in queue, continuing to poll...")
                    
            except Exception as e:
                logger.error(f"Error in poll loop: {str(e)}")
                await asyncio.sleep(POLL_SEC)
    
    async def close(self):
        """Clean up resources"""
        await self.redis_client.close()
        await self.profile_client.close()


async def main():
    """Main entry point"""
    worker = SimulationWorker()
    
    try:
        await worker.poll_jobs()
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    finally:
        await worker.close()
        logger.info("Worker shutdown complete")


if __name__ == "__main__":
    asyncio.run(main()) 