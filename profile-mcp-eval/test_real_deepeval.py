#!/usr/bin/env python3
"""
Test script for real DeepEval integration with OpenAI API.
This script submits test jobs to the Redis queue to test both mock and real conversation generation.
"""

import json
import os
import redis
import sys
from datetime import datetime
from uuid import uuid4

def create_test_job(
    user_id: str,
    template: str,
    use_real_deepeval: bool = False,
    turns: int = 5,
    model: str = "gpt-3.5-turbo"
):
    """Create a test simulation job"""
    return {
        "job_id": str(uuid4()),
        "user_id": user_id,
        "template": template,
        "simulation_type": "conversation",
        "simulation_config": {
            "turns": turns,
            "use_real_deepeval": use_real_deepeval,
            "model": model,
            "purpose": f"Test {template} conversation",
            "context": f"Testing {'real OpenAI' if use_real_deepeval else 'mock'} conversation generation"
        },
        "created_at": datetime.utcnow().isoformat(),
        "priority": 1,
        "retry_count": 0,
        "max_retries": 3
    }

def submit_job_to_redis(job: dict, redis_url: str = "redis://localhost:6379/1"):
    """Submit a job to the Redis queue"""
    try:
        r = redis.from_url(redis_url, decode_responses=True)
        job_json = json.dumps(job)
        result = r.lpush("simulation_jobs", job_json)
        print(f"✅ Job {job['job_id']} submitted successfully (queue length: {result})")
        return True
    except Exception as e:
        print(f"❌ Failed to submit job: {str(e)}")
        return False

def main():
    """Main test function"""
    
    # Check if OpenAI API key is available
    openai_key = os.getenv("OPENAI_API_KEY")
    has_openai = bool(openai_key)
    
    print("🧪 Testing DeepEval Background Worker")
    print("=" * 50)
    print(f"OpenAI API Key: {'✅ Available' if has_openai else '❌ Not set'}")
    
    # Test users (from previous database check)
    test_users = [
        "550e8400-e29b-41d4-a716-446655440000",  # test_user_demo
        "e9cbfece-af29-4832-a4cb-2efb1cde3c06"   # test_uid_conv_1
    ]
    
    # Test templates
    templates = ["health_assessment", "protocol_discussion", "belief_exploration"]
    
    print("\n📝 Test Cases:")
    print("-" * 30)
    
    test_cases = []
    
    # Test 1: Mock conversations (always work)
    for i, template in enumerate(templates):
        user_id = test_users[i % len(test_users)]
        job = create_test_job(
            user_id=user_id,
            template=template,
            use_real_deepeval=False,
            turns=4
        )
        test_cases.append((f"Mock {template}", job))
    
    # Test 2: Real OpenAI conversations (if API key available)
    if has_openai:
        for i, template in enumerate(templates[:2]):  # Test 2 templates with real OpenAI
            user_id = test_users[i % len(test_users)]
            job = create_test_job(
                user_id=user_id,
                template=template,
                use_real_deepeval=True,
                turns=3,  # Fewer turns for real API to save costs
                model="gpt-3.5-turbo"  # Use cheaper model for testing
            )
            test_cases.append((f"Real OpenAI {template}", job))
    else:
        print("⚠️  Skipping real OpenAI tests - no API key provided")
    
    # Submit all test jobs
    print(f"\n🚀 Submitting {len(test_cases)} test jobs...")
    print("-" * 40)
    
    success_count = 0
    for test_name, job in test_cases:
        print(f"\n📤 {test_name}")
        print(f"   Job ID: {job['job_id']}")
        print(f"   User ID: {job['user_id']}")
        print(f"   Template: {job['template']}")
        print(f"   Real DeepEval: {job['simulation_config']['use_real_deepeval']}")
        print(f"   Turns: {job['simulation_config']['turns']}")
        
        if submit_job_to_redis(job):
            success_count += 1
    
    print(f"\n📊 Results: {success_count}/{len(test_cases)} jobs submitted successfully")
    
    if success_count > 0:
        print("\n🔍 To monitor progress:")
        print("1. Check worker logs: docker logs profile-mcp-eval -f")
        print("2. Check health status: curl http://localhost:8100/health")
        print("3. Check queue length: docker exec profile-mcp-redis-1 redis-cli -n 1 LLEN simulation_jobs")
        print("4. View conversations: Check profile-mcp database or API")
        
        print("\n📋 Useful commands:")
        print("# Check queue length")
        print("docker exec profile-mcp-redis-1 redis-cli -n 1 LLEN simulation_jobs")
        print("\n# Check recent conversations")
        print("docker exec profile-mcp-postgres-1 psql -U postgres -d postgres -c \"SELECT id, meta->>'template', meta->>'job_id', closed FROM conversation WHERE meta->>'sim' = 'true' ORDER BY started_at DESC LIMIT 10;\"")
        
        print("\n💡 Tips:")
        print("- Mock conversations should process quickly (< 1 second)")
        print("- Real OpenAI conversations take longer (~10-15 seconds) due to API calls")
        print("- Real conversations will have 'generated_by': 'openai' in their metadata")
        print("- Failed OpenAI calls will fallback to mock conversations")

if __name__ == "__main__":
    main() 