#!/usr/bin/env python3
"""
Create a user from Don't Die account data and set up their complete profile.

This script:
1. Creates a user in profile-mcp using Don't Die account data
2. Creates a self-model in em-mcp
3. Creates belief systems based on Don't Die data
4. Syncs everything together

Usage:
    python create_user_from_dd.py --dd-token YOUR_DD_TOKEN --dd-client-id YOUR_DD_CLIENT_ID
    
Or set environment variables:
    DD_TOKEN=your_token DD_CLIENT_ID=your_client_id python create_user_from_dd.py
"""

import asyncio
import argparse
import os
import sys
import httpx
import json
from typing import Dict, Any, Optional
from uuid import uuid4

# Service URLs
PROFILE_MCP_URL = os.getenv("PROFILE_MCP_URL", "http://localhost:8010")
EM_MCP_URL = os.getenv("EM_MCP_URL", "http://localhost:8120")
DD_MCP_URL = os.getenv("DD_MCP_URL", "http://localhost:8090")

# Auth token for internal services
INTERNAL_TOKEN = os.getenv("TEST_TOKEN", "TEST_TOKEN")

class UserCreationOrchestrator:
    def __init__(self, dd_token: str, dd_client_id: str):
        self.dd_token = dd_token
        self.dd_client_id = dd_client_id
        self.headers = {
            "Authorization": f"Bearer {INTERNAL_TOKEN}",
            "Content-Type": "application/json"
        }
        self.dd_headers = {
            "Authorization": f"Bearer {dd_token}",
            "x-dd-client-id": dd_client_id,
            "Content-Type": "application/json"
        }
    
    async def create_user_in_profile_mcp(self) -> Dict[str, Any]:
        """Create user in profile-mcp using Don't Die data."""
        print("🔄 Creating user in profile-mcp...")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PROFILE_MCP_URL}/createUserFromDD",
                json={
                    "dd_token": self.dd_token,
                    "dd_client_id": self.dd_client_id
                },
                headers=self.headers
            )
            response.raise_for_status()
            result = response.json()
            
            if result["status"] == "error":
                if "already exists" in result["message"]:
                    print(f"✅ User already exists: {result['existing_user_id']}")
                    return {
                        "user_id": result["existing_user_id"],
                        "dd_user_data": result.get("dd_user_data", {}),
                        "created": False
                    }
                else:
                    raise Exception(f"Failed to create user: {result['message']}")
            
            user_data = result["data"]
            print(f"✅ User created: {user_data['user_id']}")
            print(f"   Don't Die UID: {user_data['dontdie_uid']}")
            
            return {
                "user_id": user_data["user_id"],
                "dd_user_data": user_data["dd_user_data"],
                "created": True
            }
    
    async def fetch_dd_data(self, user_id: str) -> Dict[str, Any]:
        """Fetch comprehensive data from Don't Die API."""
        print("🔄 Fetching Don't Die data...")
        
        dd_data = {}
        
        async with httpx.AsyncClient() as client:
            # Get DD Score (last 30 days)
            try:
                response = await client.get(
                    f"{DD_MCP_URL}/getDdScore",
                    params={"date": "2025-05-29", "days": 30},
                    headers=self.dd_headers
                )
                if response.status_code == 200:
                    dd_data["dd_scores"] = response.json()
                    print(f"✅ Fetched DD scores for 30 days")
            except Exception as e:
                print(f"⚠️  Could not fetch DD scores: {e}")
            
            # Get Biomarkers
            try:
                response = await client.get(
                    f"{DD_MCP_URL}/getAllBiomarkers",
                    headers=self.dd_headers
                )
                if response.status_code == 200:
                    dd_data["biomarkers"] = response.json()
                    print(f"✅ Fetched biomarkers")
            except Exception as e:
                print(f"⚠️  Could not fetch biomarkers: {e}")
            
            # Get User Protocols
            try:
                response = await client.get(
                    f"{DD_MCP_URL}/getUserProtocols",
                    headers=self.dd_headers
                )
                if response.status_code == 200:
                    dd_data["protocols"] = response.json()
                    print(f"✅ Fetched user protocols")
            except Exception as e:
                print(f"⚠️  Could not fetch protocols: {e}")
        
        return dd_data
    
    async def create_self_model(self, user_id: str) -> Dict[str, Any]:
        """Create self-model in em-mcp."""
        print("🔄 Creating self-model in em-mcp...")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{EM_MCP_URL}/createSelfModel",
                json={"user_id": user_id},
                headers=self.headers
            )
            response.raise_for_status()
            result = response.json()
            
            if result["status"] == "error":
                raise Exception(f"Failed to create self-model: {result['message']}")
            
            print(f"✅ Self-model created")
            return result["data"]
    
    async def create_belief_systems(self, user_id: str, dd_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create belief systems based on Don't Die data."""
        print("🔄 Creating belief systems...")
        
        beliefs_created = []
        
        # Create beliefs based on DD Score trends
        if "dd_scores" in dd_data:
            scores = dd_data["dd_scores"]
            if scores:
                # Analyze score trends to create beliefs
                belief_content = f"My Don't Die score tracking shows consistent health monitoring patterns"
                await self._create_belief(user_id, belief_content, 0.8)
                beliefs_created.append("DD Score Tracking")
        
        # Create beliefs based on biomarkers
        if "biomarkers" in dd_data:
            biomarkers = dd_data["biomarkers"]
            for category, data in biomarkers.items():
                if isinstance(data, dict) and "error" not in data:
                    belief_content = f"I actively monitor {category.lower()} biomarkers for health optimization"
                    await self._create_belief(user_id, belief_content, 0.7)
                    beliefs_created.append(f"{category} Monitoring")
        
        # Create beliefs based on protocols
        if "protocols" in dd_data:
            protocols = dd_data["protocols"]
            if isinstance(protocols, list) and protocols:
                belief_content = f"I follow structured health protocols for systematic improvement"
                await self._create_belief(user_id, belief_content, 0.9)
                beliefs_created.append("Protocol Adherence")
        
        print(f"✅ Created {len(beliefs_created)} beliefs: {', '.join(beliefs_created)}")
        return {"beliefs_created": beliefs_created}
    
    async def _create_belief(self, user_id: str, content: str, confidence: float):
        """Helper to create a single belief."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{EM_MCP_URL}/updateBelief",
                json={
                    "user_id": user_id,
                    "belief_system_id": user_id,  # Using user_id as belief_system_id
                    "statement": content,
                    "confidence": confidence
                },
                headers=self.headers
            )
            # Don't raise for status here as belief creation might have issues
            if response.status_code != 200:
                print(f"⚠️  Could not create belief: {content[:50]}...")
    
    async def sync_to_profile(self, user_id: str):
        """Sync self-model to profile-mcp."""
        print("🔄 Syncing self-model to profile-mcp...")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{EM_MCP_URL}/syncSelfModelToProfile",
                json={"user_id": user_id},
                headers=self.headers
            )
            
            if response.status_code == 200:
                print("✅ Self-model synced to profile-mcp")
            else:
                print(f"⚠️  Could not sync self-model: {response.text}")
    
    async def run(self) -> Dict[str, Any]:
        """Run the complete user creation process."""
        print("🚀 Starting user creation from Don't Die account...")
        
        try:
            # Step 1: Create user in profile-mcp
            user_result = await self.create_user_in_profile_mcp()
            user_id = user_result["user_id"]
            
            # Step 2: Fetch Don't Die data
            dd_data = await self.fetch_dd_data(user_id)
            
            # Step 3: Create self-model
            self_model = await self.create_self_model(user_id)
            
            # Step 4: Create belief systems
            beliefs = await self.create_belief_systems(user_id, dd_data)
            
            # Step 5: Sync to profile
            await self.sync_to_profile(user_id)
            
            print(f"\n🎉 User creation completed successfully!")
            print(f"   User ID: {user_id}")
            print(f"   Don't Die Data: {len(dd_data)} categories fetched")
            print(f"   Beliefs Created: {len(beliefs['beliefs_created'])}")
            
            return {
                "user_id": user_id,
                "dd_data_categories": list(dd_data.keys()),
                "beliefs_created": beliefs["beliefs_created"],
                "success": True
            }
            
        except Exception as e:
            print(f"\n❌ User creation failed: {e}")
            return {"success": False, "error": str(e)}

async def main():
    parser = argparse.ArgumentParser(description="Create user from Don't Die account")
    parser.add_argument("--dd-token", help="Don't Die Bearer token")
    parser.add_argument("--dd-client-id", help="Don't Die Client ID")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    # Get credentials from args or environment
    dd_token = args.dd_token or os.getenv("DD_TOKEN")
    dd_client_id = args.dd_client_id or os.getenv("DD_CLIENT_ID")
    
    if not dd_token or not dd_client_id:
        print("❌ Missing credentials!")
        print("Provide --dd-token and --dd-client-id or set DD_TOKEN and DD_CLIENT_ID environment variables")
        sys.exit(1)
    
    orchestrator = UserCreationOrchestrator(dd_token, dd_client_id)
    result = await orchestrator.run()
    
    if args.verbose:
        print(f"\nFull result: {json.dumps(result, indent=2)}")
    
    sys.exit(0 if result["success"] else 1)

if __name__ == "__main__":
    asyncio.run(main()) 