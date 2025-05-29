import pytest
import asyncio
from uuid import uuid4
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models import User, ChecklistItem, Conversation, Turn
from app.deps import get_session
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_start_conversation_creates_checklist_items():
    """Test that starting a conversation auto-creates 7 checklist items if none exist"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a test user first
        user_id = str(uuid4())
        test_user = User(id=user_id, dontdie_uid="test_uid_conv_1")
        
        # Get session and add user
        async for session in get_session():
            session.add(test_user)
            await session.commit()
            
            # Verify no checklist items exist initially
            existing_items = (await session.execute(
                select(ChecklistItem).where(ChecklistItem.user_id == user_id)
            )).scalars().all()
            assert len(existing_items) == 0
            
            # Start conversation
            response = await client.post("/startConversation", json={
                "user_id": user_id,
                "meta": {"model": "gpt-4", "template": "health_coach"}
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert "conversation_id" in data["data"]
            conversation_id = data["data"]["conversation_id"]
            
            # Verify 7 checklist items were created
            checklist_items = (await session.execute(
                select(ChecklistItem).where(ChecklistItem.user_id == user_id)
            )).scalars().all()
            assert len(checklist_items) == 7
            
            expected_buckets = {
                "health_device", "dd_score", "measurements", 
                "capabilities", "biomarkers", "demographics", "protocols"
            }
            actual_buckets = {item.bucket_code for item in checklist_items}
            assert actual_buckets == expected_buckets
            
            # Verify all items have pending status
            for item in checklist_items:
                assert item.status == "pending"
            
            break

@pytest.mark.asyncio
async def test_conversation_turn_flow():
    """Test appending turns and retrieving conversation"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a test user
        user_id = str(uuid4())
        test_user = User(id=user_id, dontdie_uid="test_uid_conv_2")
        
        async for session in get_session():
            session.add(test_user)
            await session.commit()
            
            # Start conversation
            response = await client.post("/startConversation", json={
                "user_id": user_id,
                "meta": {"model": "gpt-4"}
            })
            
            assert response.status_code == 200
            conversation_id = response.json()["data"]["conversation_id"]
            
            # Append first turn (user message)
            response = await client.post("/appendTurn", json={
                "conversation_id": conversation_id,
                "role": "user",
                "content": "Hello, I want to improve my health",
                "extra_json": {"timestamp": "2024-01-01T10:00:00Z"}
            })
            
            assert response.status_code == 200
            turn1_data = response.json()["data"]
            assert turn1_data["role"] == "user"
            assert turn1_data["content"] == "Hello, I want to improve my health"
            assert turn1_data["conversation_closed"] == False
            
            # Append second turn (assistant response)
            response = await client.post("/appendTurn", json={
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": "Great! I'd be happy to help you with your health goals.",
                "extra_json": {"model": "gpt-4", "tokens": 15}
            })
            
            assert response.status_code == 200
            turn2_data = response.json()["data"]
            assert turn2_data["role"] == "assistant"
            assert turn2_data["content"] == "Great! I'd be happy to help you with your health goals."
            
            # Get conversation and verify turns
            response = await client.get(f"/getConversation?conversation_id={conversation_id}")
            
            assert response.status_code == 200
            conv_data = response.json()["data"]
            assert conv_data["conversation_id"] == conversation_id
            assert conv_data["user_id"] == user_id
            assert conv_data["closed"] == False
            assert len(conv_data["turns"]) == 2
            
            # Verify turn order and content
            turns = conv_data["turns"]
            assert turns[0]["role"] == "user"
            assert turns[0]["content"] == "Hello, I want to improve my health"
            assert turns[0]["extra_json"]["timestamp"] == "2024-01-01T10:00:00Z"
            
            assert turns[1]["role"] == "assistant"
            assert turns[1]["content"] == "Great! I'd be happy to help you with your health goals."
            assert turns[1]["extra_json"]["model"] == "gpt-4"
            
            break

@pytest.mark.asyncio
async def test_close_conversation():
    """Test closing a conversation via appendTurn"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a test user
        user_id = str(uuid4())
        test_user = User(id=user_id, dontdie_uid="test_uid_conv_3")
        
        async for session in get_session():
            session.add(test_user)
            await session.commit()
            
            # Start conversation
            response = await client.post("/startConversation", json={
                "user_id": user_id
            })
            
            conversation_id = response.json()["data"]["conversation_id"]
            
            # Add a turn and close the conversation
            response = await client.post("/appendTurn", json={
                "conversation_id": conversation_id,
                "role": "system",
                "content": "Session ended",
                "close_conversation": True
            })
            
            assert response.status_code == 200
            assert response.json()["data"]["conversation_closed"] == True
            
            # Verify conversation is marked as closed
            response = await client.get(f"/getConversation?conversation_id={conversation_id}")
            assert response.json()["data"]["closed"] == True
            
            break

@pytest.mark.asyncio
async def test_list_conversations():
    """Test listing conversations with filtering"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create two test users
        user1_id = str(uuid4())
        user2_id = str(uuid4())
        
        async for session in get_session():
            user1 = User(id=user1_id, dontdie_uid="test_uid_conv_4a")
            user2 = User(id=user2_id, dontdie_uid="test_uid_conv_4b")
            session.add(user1)
            session.add(user2)
            await session.commit()
            
            # Create conversations for both users
            response1 = await client.post("/startConversation", json={"user_id": user1_id})
            response2 = await client.post("/startConversation", json={"user_id": user2_id})
            response3 = await client.post("/startConversation", json={"user_id": user1_id})
            
            # List all conversations
            response = await client.get("/listConversations")
            assert response.status_code == 200
            all_convs = response.json()["data"]
            assert len(all_convs) >= 3
            
            # List conversations for user1 only
            response = await client.get(f"/listConversations?user_id={user1_id}")
            assert response.status_code == 200
            user1_convs = response.json()["data"]
            assert len(user1_convs) == 2
            
            for conv in user1_convs:
                assert conv["user_id"] == user1_id
            
            # List conversations for user2 only
            response = await client.get(f"/listConversations?user_id={user2_id}")
            assert response.status_code == 200
            user2_convs = response.json()["data"]
            assert len(user2_convs) == 1
            assert user2_convs[0]["user_id"] == user2_id
            
            break 