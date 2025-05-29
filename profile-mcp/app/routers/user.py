from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from app.models import User
from app.deps import get_session
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import httpx
import os

router = APIRouter(tags=["User"])

class CreateUserRequest(BaseModel):
    dontdie_uid: str
    user_id: Optional[UUID] = None  # Allow specifying UUID, otherwise generate

class CreateUserFromDDRequest(BaseModel):
    dd_token: str
    dd_client_id: str
    user_id: Optional[UUID] = None  # Allow specifying UUID, otherwise generate

@router.post("/createUser", operation_id="create_user")
async def create_user(
    request: CreateUserRequest,
    session: AsyncSession = Depends(get_session)
):
    """Create a new user with a Don't Die UID"""
    try:
        # Check if user with this dontdie_uid already exists
        existing_user_query = select(User).where(User.dontdie_uid == request.dontdie_uid)
        existing_user = (await session.execute(existing_user_query)).scalars().first()
        
        if existing_user:
            return {
                "status": "error", 
                "message": f"User with dontdie_uid '{request.dontdie_uid}' already exists",
                "existing_user_id": str(existing_user.id)
            }
        
        # Generate UUID if not provided
        user_id = request.user_id or uuid4()
        
        # Create user
        user = User(
            id=user_id,
            dontdie_uid=request.dontdie_uid,
            created_at=datetime.utcnow()
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        return {
            "status": "ok",
            "data": {
                "user_id": str(user.id),
                "dontdie_uid": user.dontdie_uid,
                "created_at": user.created_at.isoformat()
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/createUserFromDD", operation_id="create_user_from_dd")
async def create_user_from_dd(
    request: CreateUserFromDDRequest,
    session: AsyncSession = Depends(get_session)
):
    """Create a user by fetching data from Don't Die API"""
    try:
        # Fetch user data from Don't Die API
        headers = {
            "Authorization": f"Bearer {request.dd_token}",
            "x-dd-client-id": request.dd_client_id,
        }
        
        async with httpx.AsyncClient() as client:
            # Get user account info
            dd_response = await client.get(
                "https://api.dontdie.com/account",
                headers=headers,
            )
            dd_response.raise_for_status()
            dd_user_data = dd_response.json()
        
        dontdie_uid = dd_user_data["id"]
        
        # Check if user already exists
        existing_user_query = select(User).where(User.dontdie_uid == dontdie_uid)
        existing_user = (await session.execute(existing_user_query)).scalars().first()
        
        if existing_user:
            return {
                "status": "error", 
                "message": f"User with Don't Die ID '{dontdie_uid}' already exists",
                "existing_user_id": str(existing_user.id),
                "dd_user_data": dd_user_data
            }
        
        # Generate UUID if not provided
        user_id = request.user_id or uuid4()
        
        # Create user
        user = User(
            id=user_id,
            dontdie_uid=dontdie_uid,
            created_at=datetime.utcnow()
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        return {
            "status": "ok",
            "data": {
                "user_id": str(user.id),
                "dontdie_uid": user.dontdie_uid,
                "created_at": user.created_at.isoformat(),
                "dd_user_data": dd_user_data
            }
        }
    except httpx.HTTPStatusError as e:
        return {
            "status": "error", 
            "message": f"Don't Die API error: {e.response.status_code} - {e.response.text}"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/listUsers", operation_id="list_users")
async def list_users(
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session)
):
    """List all users"""
    try:
        query = select(User).offset(offset).limit(limit).order_by(User.created_at.desc())
        users = (await session.execute(query)).scalars().all()
        
        result = []
        for user in users:
            result.append({
                "user_id": str(user.id),
                "dontdie_uid": user.dontdie_uid,
                "created_at": user.created_at.isoformat()
            })
        
        return {"status": "ok", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/getUser", operation_id="get_user")
async def get_user(
    user_id: UUID,
    session: AsyncSession = Depends(get_session)
):
    """Get a specific user by ID"""
    try:
        user_query = select(User).where(User.id == user_id)
        user = (await session.execute(user_query)).scalars().first()
        
        if not user:
            return {"status": "error", "message": "User not found"}
        
        return {
            "status": "ok",
            "data": {
                "user_id": str(user.id),
                "dontdie_uid": user.dontdie_uid,
                "created_at": user.created_at.isoformat()
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)} 