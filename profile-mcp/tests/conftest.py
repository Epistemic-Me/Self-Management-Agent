from uuid import uuid4
from datetime import datetime
from app.models import User
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.deps import DATABASE_URL
import pytest
import pytest_asyncio
from app.main import app
from app.deps import get_session as real_get_session
import redis.asyncio as redis


@pytest_asyncio.fixture
async def test_async_session():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session_factory = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with engine.begin():
        # Optionally: await conn.run_sync(Base.metadata.create_all)
        pass
    async with async_session_factory() as session:
        yield session
        # Rollback any changes made during testing
        await session.rollback()
    await engine.dispose()


@pytest.fixture(autouse=True)
def override_get_session(test_async_session):
    async def _override_get_session():
        yield test_async_session
    app.dependency_overrides[real_get_session] = _override_get_session
    yield
    app.dependency_overrides.pop(real_get_session, None)


@pytest_asyncio.fixture
async def test_user(test_async_session):
    user_id = str(uuid4())
    user = User(id=user_id, dontdie_uid="testuser", created_at=datetime.utcnow())
    test_async_session.add(user)
    await test_async_session.commit()
    return user_id


@pytest_asyncio.fixture
async def auth_headers():
    """Create authentication headers with valid token."""
    import os
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    r = redis.from_url(redis_url)
    token = "test_token_" + str(uuid4())[:8]
    try:
        await r.set(f"token:{token}", "testuser")
        yield {"Authorization": f"Bearer {token}"}
        # Cleanup
        await r.delete(f"token:{token}")
    finally:
        try:
            await r.aclose()
        except Exception:
            # Ignore errors during cleanup
            pass


@pytest_asyncio.fixture
async def redis_client():
    """Redis client for testing."""
    r = redis.from_url("redis://redis:6379/0")
    try:
        yield r
    finally:
        try:
            await r.aclose()
        except Exception:
            # Ignore errors during cleanup
            pass
