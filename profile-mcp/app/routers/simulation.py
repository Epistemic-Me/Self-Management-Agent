from fastapi import APIRouter, Depends
from app.models import SimRequest
from app.deps import get_sim_job_queue, get_current_user
from redis.asyncio import Redis
import json

router = APIRouter(tags=["Simulation"])

@router.post("/simulateConversation", operation_id="simulateConversation")
async def simulate_conversation(
    req: SimRequest,
    user: str = Depends(get_current_user),
    sim_queue: Redis = Depends(get_sim_job_queue)
):
    """
    Request body:
      { "user_id": "...", "template": "default_sleep" }
    Puts JSON on Redis list "simulation_jobs".
    """
    # Convert the request to JSON and enqueue it
    job_data = req.model_dump_json()
    await sim_queue.rpush("simulation_jobs", job_data)
    
    return {
        "status": "ok",
        "data": {
            "queued": True
        }
    } 