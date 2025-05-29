from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from app.models import Dialectic, DialecticInteraction, User, SelfModel, Conversation
from app.deps import get_session, get_current_user
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

router = APIRouter(tags=["DialecticDB"])

class StartDialecticRequest(BaseModel):
    user_id: UUID
    self_model_id: Optional[UUID] = None
    learning_objective: Optional[dict] = None
    conversation_id: Optional[UUID] = None

class AppendDialecticTurnRequest(BaseModel):
    dialectic_id: UUID
    role: str
    content: str
    extra_json: Optional[dict] = None

@router.post("/startDialectic", operation_id="start_dialectic")
async def start_dialectic(
    request: StartDialecticRequest,
    session: AsyncSession = Depends(get_session)
):
    """Start a new dialectic session"""
    try:
        # Check if user exists
        user_query = select(User).where(User.id == request.user_id)
        user = (await session.execute(user_query)).scalars().first()
        if not user:
            return {"status": "error", "message": "User not found"}
        
        # Check if self_model exists (if provided)
        if request.self_model_id:
            self_model_query = select(SelfModel).where(SelfModel.id == request.self_model_id)
            self_model = (await session.execute(self_model_query)).scalars().first()
            if not self_model:
                return {"status": "error", "message": "Self model not found"}
        
        # Check if conversation exists (if provided)
        if request.conversation_id:
            conv_query = select(Conversation).where(Conversation.id == request.conversation_id)
            conversation = (await session.execute(conv_query)).scalars().first()
            if not conversation:
                return {"status": "error", "message": "Conversation not found"}
        
        # Create dialectic
        dialectic = Dialectic(
            user_id=request.user_id,
            self_model_id=request.self_model_id,
            learning_objective=request.learning_objective,
            conversation_id=request.conversation_id,
            started_at=datetime.utcnow(),
            closed=False
        )
        session.add(dialectic)
        await session.commit()
        await session.refresh(dialectic)
        
        return {
            "status": "ok",
            "data": {
                "dialectic_id": str(dialectic.id),
                "user_id": str(dialectic.user_id),
                "self_model_id": str(dialectic.self_model_id) if dialectic.self_model_id else None,
                "learning_objective": dialectic.learning_objective,
                "conversation_id": str(dialectic.conversation_id) if dialectic.conversation_id else None,
                "started_at": dialectic.started_at.isoformat(),
                "closed": dialectic.closed
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/appendDialecticTurn", operation_id="append_dialectic_turn")
async def append_dialectic_turn(
    request: AppendDialecticTurnRequest,
    session: AsyncSession = Depends(get_session)
):
    """Append an interaction to an existing dialectic"""
    try:
        # Check if dialectic exists
        dialectic_query = select(Dialectic).where(Dialectic.id == request.dialectic_id)
        dialectic = (await session.execute(dialectic_query)).scalars().first()
        if not dialectic:
            return {"status": "error", "message": "Dialectic not found"}
        
        # Create interaction
        interaction = DialecticInteraction(
            dialectic_id=request.dialectic_id,
            role=request.role,
            content=request.content,
            extra_json=request.extra_json,
            created_at=datetime.utcnow()
        )
        session.add(interaction)
        await session.commit()
        await session.refresh(interaction)
        
        return {
            "status": "ok",
            "data": {
                "interaction_id": str(interaction.id),
                "dialectic_id": str(interaction.dialectic_id),
                "role": interaction.role,
                "content": interaction.content,
                "extra_json": interaction.extra_json,
                "created_at": interaction.created_at.isoformat()
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/getDialectic", operation_id="get_dialectic")
async def get_dialectic(
    dialectic_id: UUID = Query(...),
    session: AsyncSession = Depends(get_session)
):
    """Get a dialectic with all its interactions"""
    try:
        # Get dialectic
        dialectic_query = select(Dialectic).where(Dialectic.id == dialectic_id)
        dialectic = (await session.execute(dialectic_query)).scalars().first()
        if not dialectic:
            return {"status": "error", "message": "Dialectic not found"}
        
        # Get interactions
        interactions_query = select(DialecticInteraction).where(
            DialecticInteraction.dialectic_id == dialectic_id
        ).order_by(DialecticInteraction.created_at)
        interactions = (await session.execute(interactions_query)).scalars().all()
        
        interactions_data = []
        for interaction in interactions:
            interactions_data.append({
                "interaction_id": str(interaction.id),
                "role": interaction.role,
                "content": interaction.content,
                "extra_json": interaction.extra_json,
                "created_at": interaction.created_at.isoformat()
            })
        
        return {
            "status": "ok",
            "data": {
                "dialectic_id": str(dialectic.id),
                "user_id": str(dialectic.user_id),
                "self_model_id": str(dialectic.self_model_id) if dialectic.self_model_id else None,
                "learning_objective": dialectic.learning_objective,
                "conversation_id": str(dialectic.conversation_id) if dialectic.conversation_id else None,
                "started_at": dialectic.started_at.isoformat(),
                "closed": dialectic.closed,
                "interactions": interactions_data
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/listDialectics", operation_id="list_dialectics")
async def list_dialectics(
    user_id: Optional[UUID] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session)
):
    """List dialectics with optional user filtering"""
    try:
        query = select(Dialectic)
        if user_id:
            query = query.where(Dialectic.user_id == user_id)
        
        query = query.offset(offset).limit(limit).order_by(Dialectic.started_at.desc())
        dialectics = (await session.execute(query)).scalars().all()
        
        result = []
        for dialectic in dialectics:
            result.append({
                "dialectic_id": str(dialectic.id),
                "user_id": str(dialectic.user_id),
                "self_model_id": str(dialectic.self_model_id) if dialectic.self_model_id else None,
                "learning_objective": dialectic.learning_objective,
                "conversation_id": str(dialectic.conversation_id) if dialectic.conversation_id else None,
                "started_at": dialectic.started_at.isoformat(),
                "closed": dialectic.closed
            })
        
        return {"status": "ok", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)} 