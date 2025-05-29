from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from app.models import Conversation, Turn, ChecklistItem, User
from app.deps import get_session, get_current_user
from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

router = APIRouter(tags=["Conversation"])

REQUIRED_BUCKETS = [
    {"code": "health_device", "label": "Health Device"},
    {"code": "dd_score", "label": "Don't Die Score"},
    {"code": "measurements", "label": "Measurements"},
    {"code": "capabilities", "label": "Capabilities"},
    {"code": "biomarkers", "label": "Biomarkers"},
    {"code": "demographics", "label": "Demographics"},
    {"code": "protocols", "label": "Protocols"},
]

class StartConversationRequest(BaseModel):
    user_id: UUID
    meta: Optional[dict] = None

class AppendTurnRequest(BaseModel):
    conversation_id: UUID
    role: str
    content: str
    extra_json: Optional[dict] = None
    close_conversation: Optional[bool] = False

@router.post("/startConversation", operation_id="start_conversation")
async def start_conversation(
    request: StartConversationRequest,
    session: AsyncSession = Depends(get_session)
):
    """Start a new conversation and auto-create checklist items if none exist"""
    try:
        # Check if user exists
        user_query = select(User).where(User.id == request.user_id)
        user = (await session.execute(user_query)).scalars().first()
        if not user:
            return {"status": "error", "message": "User not found"}
        
        # Auto-create checklist items if none exist
        existing_items = (await session.execute(
            select(ChecklistItem).where(ChecklistItem.user_id == request.user_id)
        )).scalars().all()
        
        if not existing_items:
            now = datetime.utcnow()
            for bucket in REQUIRED_BUCKETS:
                new_item = ChecklistItem(
                    user_id=request.user_id,
                    bucket_code=bucket["code"],
                    status="pending",
                    updated_at=now
                )
                session.add(new_item)
        
        # Create conversation
        conversation = Conversation(
            user_id=request.user_id,
            meta=request.meta,
            started_at=datetime.utcnow(),
            closed=False
        )
        session.add(conversation)
        await session.commit()
        await session.refresh(conversation)
        
        return {
            "status": "ok",
            "data": {
                "conversation_id": str(conversation.id),
                "user_id": str(conversation.user_id),
                "started_at": conversation.started_at.isoformat(),
                "closed": conversation.closed,
                "meta": conversation.meta
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/appendTurn", operation_id="append_turn")
async def append_turn(
    request: AppendTurnRequest,
    session: AsyncSession = Depends(get_session)
):
    """Append a turn to an existing conversation"""
    try:
        # Check if conversation exists
        conv_query = select(Conversation).where(Conversation.id == request.conversation_id)
        conversation = (await session.execute(conv_query)).scalars().first()
        if not conversation:
            return {"status": "error", "message": "Conversation not found"}
        
        # Create turn
        turn = Turn(
            conversation_id=request.conversation_id,
            role=request.role,
            content=request.content,
            extra_json=request.extra_json,
            created_at=datetime.utcnow()
        )
        session.add(turn)
        
        # Close conversation if requested
        if request.close_conversation:
            conversation.closed = True
        
        await session.commit()
        await session.refresh(turn)
        
        return {
            "status": "ok",
            "data": {
                "turn_id": str(turn.id),
                "conversation_id": str(turn.conversation_id),
                "role": turn.role,
                "content": turn.content,
                "extra_json": turn.extra_json,
                "created_at": turn.created_at.isoformat(),
                "conversation_closed": conversation.closed
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/listConversations", operation_id="list_conversations")
async def list_conversations(
    user_id: Optional[UUID] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_session)
):
    """List conversations with optional user filtering"""
    try:
        query = select(Conversation)
        if user_id:
            query = query.where(Conversation.user_id == user_id)
        
        query = query.offset(offset).limit(limit).order_by(Conversation.started_at.desc())
        conversations = (await session.execute(query)).scalars().all()
        
        result = []
        for conv in conversations:
            result.append({
                "conversation_id": str(conv.id),
                "user_id": str(conv.user_id),
                "started_at": conv.started_at.isoformat(),
                "closed": conv.closed,
                "meta": conv.meta
            })
        
        return {"status": "ok", "data": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/getConversation", operation_id="get_conversation")
async def get_conversation(
    conversation_id: UUID = Query(...),
    session: AsyncSession = Depends(get_session)
):
    """Get a conversation with all its turns"""
    try:
        # Get conversation
        conv_query = select(Conversation).where(Conversation.id == conversation_id)
        conversation = (await session.execute(conv_query)).scalars().first()
        if not conversation:
            return {"status": "error", "message": "Conversation not found"}
        
        # Get turns
        turns_query = select(Turn).where(Turn.conversation_id == conversation_id).order_by(Turn.created_at)
        turns = (await session.execute(turns_query)).scalars().all()
        
        turns_data = []
        for turn in turns:
            turns_data.append({
                "turn_id": str(turn.id),
                "role": turn.role,
                "content": turn.content,
                "extra_json": turn.extra_json,
                "created_at": turn.created_at.isoformat()
            })
        
        return {
            "status": "ok",
            "data": {
                "conversation_id": str(conversation.id),
                "user_id": str(conversation.user_id),
                "started_at": conversation.started_at.isoformat(),
                "closed": conversation.closed,
                "meta": conversation.meta,
                "turns": turns_data
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)} 