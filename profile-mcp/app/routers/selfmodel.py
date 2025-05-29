from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from app.deps import get_session, get_current_user
from app import crud, models
from pydantic import BaseModel
import uuid

router = APIRouter()

class SelfModelProto(BaseModel):
    id: uuid.UUID | None = None
    user_id: uuid.UUID
    # ... add more fields as needed

@router.post("/upsertSelfModel", tags=["selfmodel"], operation_id="upsert_self_model")
async def upsert_self_model(
    proto: SelfModelProto,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    self_model = models.SelfModel(user_id=proto.user_id)
    model = await crud.upsert_self_model(session, self_model)
    return {"status": "ok", "data": model}

@router.get("/getSelfModel", tags=["selfmodel"], operation_id="get_self_model")
async def get_self_model(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    _user: str = Depends(get_current_user),
):
    model = await crud.get_self_model(session, user_id)
    return {"status": "ok", "data": model}
