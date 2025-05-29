#!/usr/bin/env python3
import asyncio
import httpx
import os

async def test_services():
    """Simple test to verify services are responding."""
    service_urls = {
        "profile_mcp": os.getenv("PROFILE_MCP_URL", "http://profile-mcp:8010"),
        "dd_mcp": os.getenv("DD_MCP_URL", "http://dd-mcp:8090"),
        "em_mcp": os.getenv("EM_MCP_URL", "http://em-mcp:8120"),
    }
    
    auth_headers = {"Authorization": "Bearer TEST_TOKEN"}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for service_name, url in service_urls.items():
            try:
                # Test health endpoint or docs
                response = await client.get(f"{url}/docs")
                print(f"✓ {service_name} is responding: {response.status_code}")
            except Exception as e:
                print(f"✗ {service_name} failed: {e}")
        
        # Test a simple API call
        try:
            response = await client.get(
                f"{service_urls['profile_mcp']}/getChecklistProgress",
                headers=auth_headers
            )
            print(f"✓ Profile MCP API call: {response.status_code}")
            if response.status_code == 200:
                print(f"  Response: {response.json()}")
        except Exception as e:
            print(f"✗ Profile MCP API call failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_services()) 