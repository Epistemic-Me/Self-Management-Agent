import pytest
import asyncio
from uuid import uuid4
from httpx import AsyncClient
from app.main import app
from app.models import User, Conversation, Turn, Dialectic, DialecticInteraction
from app.deps import get_session
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_conversation_dialectic_coexistence():
    """Test that conversations and dialectics can coexist and be linked"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create a test user
        user_id = str(uuid4())
        test_user = User(id=user_id, dontdie_uid="test_uid_coex_1")
        
        async for session in get_session():
            session.add(test_user)
            await session.commit()
            
            # Start a conversation
            conv_response = await client.post("/startConversation", json={
                "user_id": user_id,
                "meta": {"session_type": "health_coaching", "model": "gpt-4"}
            })
            
            assert conv_response.status_code == 200
            conversation_id = conv_response.json()["data"]["conversation_id"]
            
            # Add some conversation turns
            await client.post("/appendTurn", json={
                "conversation_id": conversation_id,
                "role": "system",
                "content": "Welcome to your health coaching session. Let's explore your beliefs about health."
            })
            
            await client.post("/appendTurn", json={
                "conversation_id": conversation_id,
                "role": "user",
                "content": "I'm interested in learning more about nutrition and exercise."
            })
            
            # Start a dialectic linked to this conversation
            dialectic_response = await client.post("/startDialectic", json={
                "user_id": user_id,
                "conversation_id": conversation_id,
                "learning_objective": {
                    "description": "Explore user's beliefs about nutrition and exercise",
                    "topics": ["nutrition", "exercise", "health"],
                    "target_belief_type": "ACTIONABLE",
                    "completion_percentage": 0.0
                }
            })
            
            assert dialectic_response.status_code == 200
            dialectic_id = dialectic_response.json()["data"]["dialectic_id"]
            
            # Add dialectic interactions
            await client.post("/appendDialecticTurn", json={
                "dialectic_id": dialectic_id,
                "role": "question",
                "content": "What do you believe is the most important factor in maintaining good health?",
                "extra_json": {"question_type": "belief_exploration", "priority": "high"}
            })
            
            await client.post("/appendDialecticTurn", json={
                "dialectic_id": dialectic_id,
                "role": "answer",
                "content": "I believe a balanced diet and regular exercise are equally important.",
                "extra_json": {"confidence": 0.8, "reasoning": "personal_experience"}
            })
            
            # Continue the conversation after dialectic
            await client.post("/appendTurn", json={
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": "Thank you for sharing your beliefs. Let's dive deeper into your nutrition habits."
            })
            
            # Verify both conversation and dialectic exist and are linked
            conv_data = (await client.get(f"/getConversation?conversation_id={conversation_id}")).json()["data"]
            dialectic_data = (await client.get(f"/getDialectic?dialectic_id={dialectic_id}")).json()["data"]
            
            # Verify conversation has 3 turns
            assert len(conv_data["turns"]) == 3
            assert conv_data["turns"][0]["role"] == "system"
            assert conv_data["turns"][1]["role"] == "user"
            assert conv_data["turns"][2]["role"] == "assistant"
            
            # Verify dialectic has 2 interactions and is linked to conversation
            assert len(dialectic_data["interactions"]) == 2
            assert dialectic_data["conversation_id"] == conversation_id
            assert dialectic_data["interactions"][0]["role"] == "question"
            assert dialectic_data["interactions"][1]["role"] == "answer"
            
            # Verify foreign key relationships work
            assert dialectic_data["user_id"] == user_id
            assert conv_data["user_id"] == user_id
            
            break

@pytest.mark.asyncio
async def test_multiple_dialectics_per_conversation():
    """Test that multiple dialectics can be linked to the same conversation"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create a test user
        user_id = str(uuid4())
        test_user = User(id=user_id, dontdie_uid="test_uid_coex_2")
        
        async for session in get_session():
            session.add(test_user)
            await session.commit()
            
            # Start a conversation
            conv_response = await client.post("/startConversation", json={
                "user_id": user_id,
                "meta": {"session_type": "comprehensive_assessment"}
            })
            
            conversation_id = conv_response.json()["data"]["conversation_id"]
            
            # Start first dialectic (nutrition focus)
            dialectic1_response = await client.post("/startDialectic", json={
                "user_id": user_id,
                "conversation_id": conversation_id,
                "learning_objective": {
                    "description": "Explore nutrition beliefs",
                    "topics": ["nutrition", "diet"]
                }
            })
            
            dialectic1_id = dialectic1_response.json()["data"]["dialectic_id"]
            
            # Start second dialectic (exercise focus)
            dialectic2_response = await client.post("/startDialectic", json={
                "user_id": user_id,
                "conversation_id": conversation_id,
                "learning_objective": {
                    "description": "Explore exercise beliefs",
                    "topics": ["exercise", "fitness"]
                }
            })
            
            dialectic2_id = dialectic2_response.json()["data"]["dialectic_id"]
            
            # Add interactions to both dialectics
            await client.post("/appendDialecticTurn", json={
                "dialectic_id": dialectic1_id,
                "role": "question",
                "content": "What's your approach to meal planning?"
            })
            
            await client.post("/appendDialecticTurn", json={
                "dialectic_id": dialectic2_id,
                "role": "question",
                "content": "How often do you exercise per week?"
            })
            
            # Verify both dialectics are linked to the same conversation
            dialectic1_data = (await client.get(f"/getDialectic?dialectic_id={dialectic1_id}")).json()["data"]
            dialectic2_data = (await client.get(f"/getDialectic?dialectic_id={dialectic2_id}")).json()["data"]
            
            assert dialectic1_data["conversation_id"] == conversation_id
            assert dialectic2_data["conversation_id"] == conversation_id
            assert dialectic1_data["learning_objective"]["topics"] == ["nutrition", "diet"]
            assert dialectic2_data["learning_objective"]["topics"] == ["exercise", "fitness"]
            
            # List dialectics for this user and verify both exist
            dialectics_response = await client.get(f"/listDialectics?user_id={user_id}")
            user_dialectics = dialectics_response.json()["data"]
            
            conversation_dialectics = [d for d in user_dialectics if d["conversation_id"] == conversation_id]
            assert len(conversation_dialectics) == 2
            
            break

@pytest.mark.asyncio
async def test_independent_conversations_and_dialectics():
    """Test that conversations and dialectics can exist independently"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create a test user
        user_id = str(uuid4())
        test_user = User(id=user_id, dontdie_uid="test_uid_coex_3")
        
        async for session in get_session():
            session.add(test_user)
            await session.commit()
            
            # Create standalone conversation
            conv_response = await client.post("/startConversation", json={
                "user_id": user_id,
                "meta": {"type": "standalone_chat"}
            })
            
            standalone_conv_id = conv_response.json()["data"]["conversation_id"]
            
            # Create standalone dialectic (no conversation link)
            dialectic_response = await client.post("/startDialectic", json={
                "user_id": user_id,
                "learning_objective": {
                    "description": "Standalone belief exploration",
                    "topics": ["general_health"]
                }
            })
            
            standalone_dialectic_id = dialectic_response.json()["data"]["dialectic_id"]
            
            # Add content to both
            await client.post("/appendTurn", json={
                "conversation_id": standalone_conv_id,
                "role": "user",
                "content": "This is a standalone conversation"
            })
            
            await client.post("/appendDialecticTurn", json={
                "dialectic_id": standalone_dialectic_id,
                "role": "question",
                "content": "This is a standalone dialectic question"
            })
            
            # Verify they exist independently
            conv_data = (await client.get(f"/getConversation?conversation_id={standalone_conv_id}")).json()["data"]
            dialectic_data = (await client.get(f"/getDialectic?dialectic_id={standalone_dialectic_id}")).json()["data"]
            
            assert conv_data["conversation_id"] == standalone_conv_id
            assert conv_data["meta"]["type"] == "standalone_chat"
            assert len(conv_data["turns"]) == 1
            
            assert dialectic_data["dialectic_id"] == standalone_dialectic_id
            assert dialectic_data["conversation_id"] is None  # No link
            assert len(dialectic_data["interactions"]) == 1
            
            break

@pytest.mark.asyncio
async def test_foreign_key_constraints():
    """Test that foreign key constraints are properly enforced"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create a test user
        user_id = str(uuid4())
        test_user = User(id=user_id, dontdie_uid="test_uid_coex_4")
        
        async for session in get_session():
            session.add(test_user)
            await session.commit()
            
            # Create conversation and dialectic
            conv_response = await client.post("/startConversation", json={
                "user_id": user_id
            })
            conversation_id = conv_response.json()["data"]["conversation_id"]
            
            dialectic_response = await client.post("/startDialectic", json={
                "user_id": user_id,
                "conversation_id": conversation_id
            })
            dialectic_id = dialectic_response.json()["data"]["dialectic_id"]
            
            # Test invalid conversation_id for dialectic
            invalid_conv_id = str(uuid4())
            response = await client.post("/startDialectic", json={
                "user_id": user_id,
                "conversation_id": invalid_conv_id
            })
            
            assert response.status_code == 200
            assert response.json()["status"] == "error"
            assert "Conversation not found" in response.json()["message"]
            
            # Test invalid conversation_id for turn
            response = await client.post("/appendTurn", json={
                "conversation_id": invalid_conv_id,
                "role": "user",
                "content": "This should fail"
            })
            
            assert response.status_code == 200
            assert response.json()["status"] == "error"
            assert "Conversation not found" in response.json()["message"]
            
            # Test invalid dialectic_id for interaction
            invalid_dialectic_id = str(uuid4())
            response = await client.post("/appendDialecticTurn", json={
                "dialectic_id": invalid_dialectic_id,
                "role": "question",
                "content": "This should fail"
            })
            
            assert response.status_code == 200
            assert response.json()["status"] == "error"
            assert "Dialectic not found" in response.json()["message"]
            
            break

@pytest.mark.asyncio
async def test_cross_table_data_integrity():
    """Test data integrity across conversation and dialectic tables"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Create a test user
        user_id = str(uuid4())
        test_user = User(id=user_id, dontdie_uid="test_uid_coex_5")
        
        async for session in get_session():
            session.add(test_user)
            await session.commit()
            
            # Create linked conversation and dialectic
            conv_response = await client.post("/startConversation", json={
                "user_id": user_id,
                "meta": {"session_id": "test_session_123"}
            })
            conversation_id = conv_response.json()["data"]["conversation_id"]
            
            dialectic_response = await client.post("/startDialectic", json={
                "user_id": user_id,
                "conversation_id": conversation_id,
                "learning_objective": {
                    "description": "Test data integrity",
                    "topics": ["integrity_test"],
                    "metadata": {"test_flag": True}
                }
            })
            dialectic_id = dialectic_response.json()["data"]["dialectic_id"]
            
            # Add multiple turns and interactions with timestamps
            import time
            base_time = time.time()
            
            for i in range(3):
                await client.post("/appendTurn", json={
                    "conversation_id": conversation_id,
                    "role": "user" if i % 2 == 0 else "assistant",
                    "content": f"Turn {i+1} content",
                    "extra_json": {"sequence": i+1, "timestamp": base_time + i}
                })
                
                await client.post("/appendDialecticTurn", json={
                    "dialectic_id": dialectic_id,
                    "role": "question" if i % 2 == 0 else "answer",
                    "content": f"Interaction {i+1} content",
                    "extra_json": {"sequence": i+1, "timestamp": base_time + i}
                })
            
            # Retrieve and verify data integrity
            conv_data = (await client.get(f"/getConversation?conversation_id={conversation_id}")).json()["data"]
            dialectic_data = (await client.get(f"/getDialectic?dialectic_id={dialectic_id}")).json()["data"]
            
            # Verify conversation data
            assert len(conv_data["turns"]) == 3
            assert conv_data["meta"]["session_id"] == "test_session_123"
            for i, turn in enumerate(conv_data["turns"]):
                assert turn["extra_json"]["sequence"] == i + 1
                assert turn["content"] == f"Turn {i+1} content"
            
            # Verify dialectic data
            assert len(dialectic_data["interactions"]) == 3
            assert dialectic_data["learning_objective"]["metadata"]["test_flag"] == True
            for i, interaction in enumerate(dialectic_data["interactions"]):
                assert interaction["extra_json"]["sequence"] == i + 1
                assert interaction["content"] == f"Interaction {i+1} content"
            
            # Verify the link is maintained
            assert dialectic_data["conversation_id"] == conversation_id
            assert dialectic_data["user_id"] == user_id
            assert conv_data["user_id"] == user_id
 