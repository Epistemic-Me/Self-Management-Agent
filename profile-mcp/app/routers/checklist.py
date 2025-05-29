from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from app.models import ChecklistItem, User
from app.deps import async_session, get_current_user, get_session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

REQUIRED_BUCKETS = [
    {"code": "health_device", "label": "Health Device"},
    {"code": "dd_score", "label": "Don't Die Score"},
    {"code": "measurements", "label": "Measurements"},
    {"code": "capabilities", "label": "Capabilities"},
    {"code": "biomarkers", "label": "Biomarkers"},
    {"code": "demographics", "label": "Demographics"},
    {"code": "protocols", "label": "Protocols"},
]

@router.get("/getChecklistProgress", operation_id="get_checklist_progress")
async def get_checklist_progress(session: AsyncSession = Depends(get_session), user_id: str = Depends(get_current_user)):
    items = (await session.execute(select(ChecklistItem).where(ChecklistItem.user_id == user_id))).scalars().all()
    codes_existing = {item.bucket_code for item in items}
    now = datetime.utcnow()
    created = []
    for bucket in REQUIRED_BUCKETS:
        if bucket["code"] not in codes_existing:
            new_item = ChecklistItem(user_id=user_id, bucket_code=bucket["code"], status="pending", updated_at=now)
            session.add(new_item)
            created.append(new_item)
    if created:
        await session.commit()
        items += created
    # Return simplified format for tests
    resp_items = [
        {
            "bucket_code": item.bucket_code,
            "status": item.status,
            "updated_at": item.updated_at,
        }
        for item in items
    ]
    return resp_items

@router.post("/markChecklistItem", operation_id="mark_checklist_item")
async def mark_checklist_item(
    user_id: UUID,
    bucket_code: str,
    status: str,
    data_ref: Optional[dict] = None,
    source: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
):
    q = select(ChecklistItem).where(ChecklistItem.user_id == user_id, ChecklistItem.bucket_code == bucket_code)
    item = (await session.execute(q)).scalars().first()
    now = datetime.utcnow()
    if item:
        item.status = status
        item.data_ref = data_ref
        item.source = source
        item.updated_at = now
    else:
        item = ChecklistItem(
            user_id=user_id,
            bucket_code=bucket_code,
            status=status,
            data_ref=data_ref,
            source=source,
            updated_at=now,
        )
        session.add(item)
    await session.commit()
    return {"status": "ok", "data": {"code": bucket_code, "status": status}}
