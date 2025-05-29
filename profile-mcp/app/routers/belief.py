from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession
from app.deps import get_session, get_current_user
from app import crud, models
from pydantic import BaseModel, Field
import uuid
from sqlalchemy.exc import IntegrityError

router = APIRouter()

class BeliefProto(BaseModel):
    id: uuid.UUID | None = None
    belief_system_id: uuid.UUID
    context_uuid: str | None = None
    statement: str
    confidence: float = Field(
        ..., 
        ge=0.0, 
        le=1.0, 
        description="Confidence value must be between 0 and 1"
    )

@router.post("/upsertBelief", tags=["belief"], operation_id="upsert_belief")
async def upsert_belief(
    proto: BeliefProto,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    belief = models.Belief(
        belief_system_id=proto.belief_system_id,
        context_uuid=proto.context_uuid,
        statement=proto.statement,
        confidence=proto.confidence,
    )
    
    try:
        model = await crud.upsert_belief(session, belief)
        return {"status": "ok", "data": model}
    except IntegrityError as e:
        # Handle foreign key constraint violations and other integrity errors
        if "belief_belief_system_id_fkey" in str(e):
            raise HTTPException(
                status_code=400, 
                detail=f"Belief system with ID {proto.belief_system_id} does not exist"
            )
        else:
            raise HTTPException(
                status_code=400, 
                detail="Database integrity constraint violation"
            )
