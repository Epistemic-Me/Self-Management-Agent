from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from app.models import ProtocolTemplate, User
from app.deps import async_session, get_session
from typing import Optional, List
from uuid import UUID

router = APIRouter()

@router.get("/listProtocolTemplates", operation_id="list_protocol_templates")
async def list_protocol_templates(
    habit_type: Optional[str] = Query(None),
    session=Depends(get_session)
):
    q = select(ProtocolTemplate).where(ProtocolTemplate.is_active == True)
    if habit_type:
        q = q.where(ProtocolTemplate.habit_type == habit_type)
    templates = (await session.execute(q)).scalars().all()
    return {"status": "ok", "data": [t.dict() for t in templates]}

@router.post("/generateProtocol", operation_id="generate_protocol")
async def generate_protocol(
    user_id: UUID,
    template_id: UUID,
    session=Depends(get_session)
):
    template = (await session.execute(select(ProtocolTemplate).where(ProtocolTemplate.id == template_id))).scalars().first()
    if not template:
        raise HTTPException(404, "Template not found")
    # TODO: Pull latest EM beliefs & DD measurements, fill placeholders
    personalized = template.dd_protocol_json  # Placeholder: return as-is
    return {"status": "ok", "data": personalized}
