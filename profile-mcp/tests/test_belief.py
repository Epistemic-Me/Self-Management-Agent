import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.models import BeliefSystem, SelfModel
import uuid
import pytest_asyncio


@pytest_asyncio.fixture
async def test_self_model(test_async_session, test_user):
    """Create a test self model."""
    self_model = SelfModel(id=uuid.uuid4(), user_id=test_user)
    test_async_session.add(self_model)
    await test_async_session.commit()
    await test_async_session.refresh(self_model)
    return self_model


@pytest_asyncio.fixture
async def test_belief_system(test_async_session, test_self_model):
    """Create a test belief system."""
    # Get the self model (it's already awaited by pytest)
    self_model = test_self_model
    
    belief_system = BeliefSystem(
        id=uuid.uuid4(),
        self_model_id=self_model.id,
        name="Test Belief System"
    )
    test_async_session.add(belief_system)
    await test_async_session.commit()
    await test_async_session.refresh(belief_system)
    return belief_system


@pytest.mark.asyncio
async def test_upsert_self_model_success(test_user, auth_headers):
    """Test successful self model creation."""
    user_id = test_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create self model
        sm_data = {"user_id": user_id}
        response = await ac.post("/upsertSelfModel", json=sm_data, headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "data" in data


@pytest.mark.asyncio
async def test_upsert_belief_success(test_user, auth_headers, test_belief_system):
    """Test successful belief creation."""
    # Get the belief system (it's already awaited by pytest)
    belief_system = test_belief_system
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Create belief with valid belief_system_id
        belief_data = {
            "belief_system_id": str(belief_system.id),
            "statement": "Exercise is important for health",
            "confidence": 0.9
        }
        response = await ac.post("/upsertBelief", json=belief_data, headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "data" in data
    assert data["data"]["statement"] == "Exercise is important for health"
    assert data["data"]["confidence"] == 0.9
    assert data["data"]["belief_system_id"] == str(belief_system.id)


@pytest.mark.asyncio
async def test_complete_belief_workflow(test_user, auth_headers):
    """Test the complete workflow: User -> SelfModel -> BeliefSystem -> Belief."""
    user_id = test_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Step 1: Create self model
        sm_data = {"user_id": user_id}
        sm_response = await ac.post("/upsertSelfModel", json=sm_data, headers=auth_headers)
        assert sm_response.status_code == 200
        self_model_id = sm_response.json()["data"]["id"]
        
        # Step 2: Create belief system (via database since no API endpoint exists)
        from app.deps import async_session
        from app.models import BeliefSystem
        belief_system_id = str(uuid.uuid4())
        async with async_session() as session:
            belief_system = BeliefSystem(
                id=belief_system_id,
                self_model_id=self_model_id,
                name="Health Beliefs"
            )
            session.add(belief_system)
            await session.commit()
        
        # Step 3: Create belief
        belief_data = {
            "belief_system_id": belief_system_id,
            "statement": "I believe regular exercise improves my health",
            "confidence": 0.85
        }
        belief_response = await ac.post("/upsertBelief", json=belief_data, headers=auth_headers)
        assert belief_response.status_code == 200
        belief_data_response = belief_response.json()
        assert belief_data_response["status"] == "ok"
        assert belief_data_response["data"]["statement"] == "I believe regular exercise improves my health"
        assert belief_data_response["data"]["confidence"] == 0.85


@pytest.mark.asyncio
async def test_upsert_belief_invalid_confidence(auth_headers, test_belief_system):
    """Test belief creation with invalid confidence value."""
    # Get the belief system (it's already awaited by pytest)
    belief_system = test_belief_system
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        belief_data = {
            "belief_system_id": str(belief_system.id),
            "statement": "Test belief",
            "confidence": 1.5  # Invalid: > 1.0
        }
        response = await ac.post("/upsertBelief", json=belief_data, headers=auth_headers)
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_upsert_belief_unauthorized():
    """Test belief creation without authentication."""
    belief_data = {
        "belief_system_id": str(uuid.uuid4()),
        "statement": "Test belief",
        "confidence": 0.8
    }
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/upsertBelief", json=belief_data)
    
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_upsert_belief_nonexistent_belief_system(auth_headers):
    """Test belief creation with non-existent belief system ID."""
    belief_data = {
        "belief_system_id": str(uuid.uuid4()),  # Non-existent ID
        "statement": "Test belief",
        "confidence": 0.8
    }
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/upsertBelief", json=belief_data, headers=auth_headers)
    
    # Should return 400 with a clean error message for foreign key constraint violation
    assert response.status_code == 400
    data = response.json()
    assert "does not exist" in data["detail"]


@pytest.mark.asyncio
async def test_get_self_model(test_user, auth_headers):
    """Test retrieving self model."""
    user_id = test_user
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(f"/getSelfModel?user_id={user_id}", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "data" in data
