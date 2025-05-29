#!/usr/bin/env python3
"""
Simple test for one real OpenAI conversation generation
"""

import json
import redis
from datetime import datetime
from uuid import uuid4

def main():
    # Create a single real OpenAI test job
    job = {
        "job_id": str(uuid4()),
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "template": "health_assessment",
        "simulation_type": "conversation",
        "simulation_config": {
            "turns": 3,
            "use_real_deepeval": True,
            "model": "gpt-3.5-turbo",
            "purpose": "Test real OpenAI health assessment conversation",
            "context": "Testing real OpenAI conversation generation with health coaching"
        },
        "created_at": datetime.now().isoformat(),
        "priority": 1,
        "retry_count": 0,
        "max_retries": 3
    }
    
    print(f"🧪 Testing Single Real OpenAI Job")
    print(f"Job ID: {job['job_id']}")
    print(f"Template: {job['template']}")
    print(f"Turns: {job['simulation_config']['turns']}")
    print(f"Model: {job['simulation_config']['model']}")
    
    # Submit to Redis
    try:
        r = redis.from_url("redis://localhost:6379/1", decode_responses=True)
        job_json = json.dumps(job)
        result = r.lpush("simulation_jobs", job_json)
        print(f"✅ Job submitted successfully (queue length: {result})")
        
        print(f"\n🔍 Monitor with:")
        print(f"docker logs profile-mcp-eval -f")
        print(f"\n🗄️ Check result with:")
        print(f"docker exec profile-mcp-postgres-1 psql -U postgres -d postgres -c \"SELECT id, meta->>'job_id', meta->>'generated_by', started_at FROM conversation WHERE meta->>'job_id' = '{job['job_id']}';\"")
        
    except Exception as e:
        print(f"❌ Failed to submit job: {str(e)}")

if __name__ == "__main__":
    main() 