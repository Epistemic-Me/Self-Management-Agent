import os
from contextlib import asynccontextmanager
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from fastapi import Depends, HTTPException, status, Request
from redis.asyncio import Redis, from_url
import boto3
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import AsyncGenerator

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@postgres:5434/postgres")
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
SIM_JOB_QUEUE_URL = os.getenv("SIM_JOB_QUEUE_URL", "redis://redis:6379/1")

from tenacity import retry, wait_fixed, stop_after_attempt

@retry(wait=wait_fixed(2), stop=stop_after_attempt(15))
async def wait_for_db():
    try:
        test_engine = create_async_engine(DATABASE_URL, echo=True)
        async with test_engine.begin() as conn:
            await conn.run_sync(lambda _: None)
    except Exception as e:
        print(f"Waiting for DB: {e}")
        raise

engine = create_async_engine(DATABASE_URL, echo=True)
async_session = async_sessionmaker(engine, expire_on_commit=False)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

@asynccontextmanager
async def lifespan(app):
    # Wait for the database to be ready before starting the app
    await wait_for_db()
    yield

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

async def get_redis() -> Redis:
    return from_url(REDIS_URL, decode_responses=True)

async def get_sim_job_queue() -> Redis:
    return from_url(SIM_JOB_QUEUE_URL, decode_responses=True)

def get_minio():
    return boto3.client(
        "s3",
        endpoint_url=MINIO_ENDPOINT,
        aws_access_key_id=MINIO_ACCESS_KEY,
        aws_secret_access_key=MINIO_SECRET_KEY,
    )

security = HTTPBearer()

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security), redis: Redis = Depends(get_redis)):
    token = credentials.credentials
    user_id = await redis.get(f"token:{token}")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user_id
