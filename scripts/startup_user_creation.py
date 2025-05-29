#!/usr/bin/env python3
"""
Startup script for creating users during docker compose initialization.

This script checks for DD_TOKEN and DD_CLIENT_ID environment variables
and creates a user if they are present.
"""

import asyncio
import os
import sys
import time
import httpx
from pathlib import Path

# Add the scripts directory to the path so we can import the orchestrator
sys.path.append(str(Path(__file__).parent))

from create_user_from_dd import UserCreationOrchestrator

async def wait_for_services():
    """Wait for all services to be ready."""
    services = [
        ("profile-mcp", "http://profile-mcp:8010/health"),
        ("em-mcp", "http://em-mcp:8120/health"),
        ("dd-mcp", "http://dd-mcp:8090/health")
    ]
    
    print("🔄 Waiting for services to be ready...")
    
    for service_name, health_url in services:
        max_retries = 30
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(health_url, timeout=5.0)
                    if response.status_code == 200:
                        print(f"✅ {service_name} is ready")
                        break
            except Exception:
                pass
            
            retry_count += 1
            if retry_count < max_retries:
                print(f"⏳ Waiting for {service_name}... ({retry_count}/{max_retries})")
                await asyncio.sleep(2)
            else:
                print(f"❌ {service_name} failed to start after {max_retries} retries")
                return False
    
    print("✅ All services are ready!")
    return True

async def main():
    """Main startup function."""
    print("🚀 Self-Management Agent Startup User Creation")
    
    # Check for Don't Die credentials
    dd_token = os.getenv("DD_TOKEN")
    dd_client_id = os.getenv("DD_CLIENT_ID")
    
    if not dd_token or not dd_client_id:
        print("ℹ️  No Don't Die credentials found (DD_TOKEN, DD_CLIENT_ID)")
        print("   Skipping user creation. You can create users manually later.")
        return
    
    print(f"🔑 Found Don't Die credentials")
    
    # Wait for services to be ready
    if not await wait_for_services():
        print("❌ Services failed to start, skipping user creation")
        return
    
    # Create user
    try:
        orchestrator = UserCreationOrchestrator(dd_token, dd_client_id)
        result = await orchestrator.run()
        
        if result["success"]:
            print(f"\n🎉 Startup user creation completed!")
            print(f"   User ID: {result['user_id']}")
            print(f"   You can now use the web UI to interact with this user.")
        else:
            print(f"\n⚠️  User creation failed: {result['error']}")
            print("   You can try creating the user manually later.")
    
    except Exception as e:
        print(f"\n❌ Unexpected error during user creation: {e}")
        print("   You can try creating the user manually later.")

if __name__ == "__main__":
    asyncio.run(main()) 