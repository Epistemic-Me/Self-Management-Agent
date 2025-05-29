import pytest
import asyncio
from uuid import uuid4
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models import User, SelfModel, Dialectic, DialecticInteraction
from app.deps import get_session
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_start_dialectic_basic():
    """Test starting a basic dialectic session"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a test user
        user_id = str(uuid4())
        test_user = User(id=user_id, dontdie_uid="test_uid_dial_1")
        
        async for session in get_session():
            session.add(test_user)
            await session.commit()
            
            # Start dialectic
            response = await client.post("/startDialectic", json={
                "user_id": user_id,
                "learning_objective": {
                    "description": "Learn about user's health beliefs",
                    "topics": ["health", "fitness", "exercise"],
                    "target_belief_type": "FALSIFIABLE",
                    "completion_percentage": 0.0
                }
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
            assert "dialectic_id" in data["data"]
            assert data["data"]["user_id"] == user_id
            assert data["data"]["self_model_id"] is None
            assert data["data"]["conversation_id"] is None
            assert data["data"]["closed"] == False
            assert data["data"]["learning_objective"]["description"] == "Learn about user's health beliefs"
            
            break

@pytest.mark.asyncio
async def test_dialectic_with_self_model():
    """Test starting a dialectic with a self model"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create a test user and self model
        user_id = str(uuid4())
        self_model_id = str(uuid4())
        
        async for session in get_session():
            test_user = User(id=user_id, dontdie_uid="test_uid_dial_2")
            test_self_model = SelfModel(id=self_model_id, user_id=user_id)
            session.add(test_user)
            session.add(test_self_model)
            await session.commit()
            
            # Start dialectic with self model
            response = await client.post("/startDialectic", json={
                "user_id": user_id,
                "self_model_id": self_model_id,
                "learning_objective": {
                    "description": "Explore beliefs about nutrition",
                    "topics": ["nutrition", "diet"],
                    "target_belief_type": "ACTIONABLE"
                }
            })
            
            assert response.status_code == 200
            data = response.json()["data"]
            assert data["user_id"] == user_id
            assert data["self_model_id"] == self_model_id
            assert data["learning_objective"]["description"] == "Explore beliefs about nutrition"
            
            break

@pytest.mark.asyncio
async def test_dialectic_interactions_flow():
    """Test appending interactions and retrieving dialectic"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create a test user
        user_id = str(uuid4())
        test_user = User(id=user_id, dontdie_uid="test_uid_dial_3")
        
        async for session in get_session():
            session.add(test_user)
            await session.commit()
            
            # Start dialectic
            response = await client.post("/startDialectic", json={
                "user_id": user_id,
                "learning_objective": {
                    "description": "Understand exercise beliefs",
                    "topics": ["exercise", "fitness"]
                }
            })
            
            dialectic_id = response.json()["data"]["dialectic_id"]
            
            # Append question interaction
            response = await client.post("/appendDialecticTurn", json={
                "dialectic_id": dialectic_id,
                "role": "question",
                "content": "What is your opinion on daily exercise?",
                "extra_json": {"question_type": "open_ended", "category": "exercise"}
            })
            
            assert response.status_code == 200
            question_data = response.json()["data"]
            assert question_data["role"] == "question"
            assert question_data["content"] == "What is your opinion on daily exercise?"
            assert question_data["dialectic_id"] == dialectic_id
            
            # Append answer interaction
            response = await client.post("/appendDialecticTurn", json={
                "dialectic_id": dialectic_id,
                "role": "answer",
                "content": "I think daily exercise is essential for good health and mental wellbeing.",
                "extra_json": {"confidence": 0.9, "source": "personal_experience"}
            })
            
            assert response.status_code == 200
            answer_data = response.json()["data"]
            assert answer_data["role"] == "answer"
            assert answer_data["content"] == "I think daily exercise is essential for good health and mental wellbeing."
            
            # Get dialectic and verify interactions
            response = await client.get(f"/getDialectic?dialectic_id={dialectic_id}")
            
            assert response.status_code == 200
            dialectic_data = response.json()["data"]
            assert dialectic_data["dialectic_id"] == dialectic_id
            assert dialectic_data["user_id"] == user_id
            assert len(dialectic_data["interactions"]) == 2
            
            # Verify interaction order and content
            interactions = dialectic_data["interactions"]
            assert interactions[0]["role"] == "question"
            assert interactions[0]["content"] == "What is your opinion on daily exercise?"
            assert interactions[0]["extra_json"]["question_type"] == "open_ended"
            
            assert interactions[1]["role"] == "answer"
            assert interactions[1]["content"] == "I think daily exercise is essential for good health and mental wellbeing."
            assert interactions[1]["extra_json"]["confidence"] == 0.9
            
            # Verify learning objective persists
            assert dialectic_data["learning_objective"]["description"] == "Understand exercise beliefs"
            assert dialectic_data["learning_objective"]["topics"] == ["exercise", "fitness"]
            
            break

@pytest.mark.asyncio
async def test_list_dialectics():
    """Test listing dialectics with filtering"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create two test users
        user1_id = str(uuid4())
        user2_id = str(uuid4())
        
        async for session in get_session():
            user1 = User(id=user1_id, dontdie_uid="test_uid_dial_4a")
            user2 = User(id=user2_id, dontdie_uid="test_uid_dial_4b")
            session.add(user1)
            session.add(user2)
            await session.commit()
            
            # Create dialectics for both users
            response1 = await client.post("/startDialectic", json={
                "user_id": user1_id,
                "learning_objective": {"description": "Health beliefs for user 1"}
            })
            response2 = await client.post("/startDialectic", json={
                "user_id": user2_id,
                "learning_objective": {"description": "Health beliefs for user 2"}
            })
            response3 = await client.post("/startDialectic", json={
                "user_id": user1_id,
                "learning_objective": {"description": "Nutrition beliefs for user 1"}
            })
            
            # List all dialectics
            response = await client.get("/listDialectics")
            assert response.status_code == 200
            all_dialectics = response.json()["data"]
            assert len(all_dialectics) >= 3
            
            # List dialectics for user1 only
            response = await client.get(f"/listDialectics?user_id={user1_id}")
            assert response.status_code == 200
            user1_dialectics = response.json()["data"]
            assert len(user1_dialectics) == 2
            
            for dialectic in user1_dialectics:
                assert dialectic["user_id"] == user1_id
            
            # List dialectics for user2 only
            response = await client.get(f"/listDialectics?user_id={user2_id}")
            assert response.status_code == 200
            user2_dialectics = response.json()["data"]
            assert len(user2_dialectics) == 1
            assert user2_dialectics[0]["user_id"] == user2_id
            assert user2_dialectics[0]["learning_objective"]["description"] == "Health beliefs for user 2"
            
            break

@pytest.mark.asyncio
async def test_dialectic_error_cases():
    """Test error handling for dialectic operations"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Test starting dialectic with non-existent user
        fake_user_id = str(uuid4())
        response = await client.post("/startDialectic", json={
            "user_id": fake_user_id
        })
        
        assert response.status_code == 200
        assert response.json()["status"] == "error"
        assert "User not found" in response.json()["message"]
        
        # Test appending turn to non-existent dialectic
        fake_dialectic_id = str(uuid4())
        response = await client.post("/appendDialecticTurn", json={
            "dialectic_id": fake_dialectic_id,
            "role": "question",
            "content": "Test question"
        })
        
        assert response.status_code == 200
        assert response.json()["status"] == "error"
        assert "Dialectic not found" in response.json()["message"]
        
        # Test getting non-existent dialectic
        response = await client.get(f"/getDialectic?dialectic_id={fake_dialectic_id}")
        assert response.status_code == 200
        assert response.json()["status"] == "error"
        assert "Dialectic not found" in response.json()["message"]

@pytest.mark.asyncio
async def test_dialectic_with_conversation_link():
    """Test linking dialectic to a conversation"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create a test user
        user_id = str(uuid4())
        test_user = User(id=user_id, dontdie_uid="test_uid_dial_5")
        
        async for session in get_session():
            session.add(test_user)
            await session.commit()
            
            # Start a conversation first
            conv_response = await client.post("/startConversation", json={
                "user_id": user_id,
                "meta": {"type": "dialectic_session"}
            })
            
            conversation_id = conv_response.json()["data"]["conversation_id"]
            
            # Start dialectic linked to conversation
            response = await client.post("/startDialectic", json={
                "user_id": user_id,
                "conversation_id": conversation_id,
                "learning_objective": {
                    "description": "Linked dialectic session",
                    "topics": ["health"]
                }
            })
            
            assert response.status_code == 200
            dialectic_data = response.json()["data"]
            assert dialectic_data["conversation_id"] == conversation_id
            assert dialectic_data["user_id"] == user_id
            
            # Verify the link persists when retrieving
            response = await client.get(f"/getDialectic?dialectic_id={dialectic_data['dialectic_id']}")
            retrieved_data = response.json()["data"]
            assert retrieved_data["conversation_id"] == conversation_id
            
            break 