from fastapi import APIRouter, Depends, Query
from sqlmodel.ext.asyncio.session import AsyncSession
from app.deps import get_session, get_current_user
from app import crud, models
from pydantic import BaseModel
import uuid
from datetime import datetime

router = APIRouter()

class MeasurementIn(BaseModel):
    user_id: uuid.UUID
    type: str
    value: float
    unit: str
    captured_at: str

@router.post("/upsertMeasurement", tags=["measurement"], operation_id="upsert_measurement")
async def upsert_measurement(
    body: MeasurementIn,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    # Parse the captured_at string to datetime (timezone-naive for database)
    captured_at = datetime.fromisoformat(body.captured_at.replace('Z', '+00:00')).replace(tzinfo=None)
    
    measurement = models.Measurement(
        user_id=body.user_id,
        type=body.type,
        value=body.value,
        unit=body.unit,
        captured_at=captured_at,
    )
    
    model = await crud.upsert_measurement(session, measurement)
    return {"status": "ok", "data": model}

@router.get("/getCohortStats", tags=["measurement"], operation_id="get_cohort_stats")
async def get_cohort_stats(
    metric: str = Query(...),
    window: str = Query(...),
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user),
):
    # Placeholder: implement SQL window aggregation
    return {"status": "ok", "data": {}}

@router.get("/getProgress", tags=["measurement"], operation_id="get_progress")
async def get_progress(
    user_id: uuid.UUID = Query(...),
    session: AsyncSession = Depends(get_session),
    _user: str = Depends(get_current_user),
):
    # Placeholder: implement profile progress calculation
    return {"status": "ok", "data": {}}
