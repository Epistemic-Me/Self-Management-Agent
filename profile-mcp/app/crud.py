from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app import models
from typing import Optional, List
import uuid

async def get_user(session: AsyncSession, user_id: uuid.UUID) -> Optional[models.User]:
    result = await session.execute(select(models.User).where(models.User.id == user_id))
    return result.scalar_one_or_none()

async def upsert_self_model(session: AsyncSession, self_model: models.SelfModel) -> models.SelfModel:
    # Check if a self model already exists for this user
    existing = await get_self_model(session, self_model.user_id)
    
    if existing:
        # Update the existing model
        # For now, we'll just return the existing one since SelfModel doesn't have many fields to update
        # In the future, you might want to update specific fields here
        await session.refresh(existing)
        return existing
    else:
        # Create a new model
        session.add(self_model)
        await session.commit()
        await session.refresh(self_model)
        return self_model

async def get_self_model(session: AsyncSession, user_id: uuid.UUID) -> Optional[models.SelfModel]:
    result = await session.execute(
        select(models.SelfModel)
        .where(models.SelfModel.user_id == user_id)
    )
    return result.scalars().first()

async def get_self_models(session: AsyncSession, user_id: uuid.UUID) -> List[models.SelfModel]:
    result = await session.execute(
        select(models.SelfModel)
        .where(models.SelfModel.user_id == user_id)
    )
    return list(result.scalars().all())

async def upsert_belief(session: AsyncSession, belief: models.Belief) -> models.Belief:
    session.add(belief)
    await session.commit()
    await session.refresh(belief)
    return belief

async def upsert_measurement(session: AsyncSession, measurement: models.Measurement) -> models.Measurement:
    session.add(measurement)
    await session.commit()
    await session.refresh(measurement)
    return measurement

async def get_measurements(session: AsyncSession, user_id: uuid.UUID) -> List[models.Measurement]:
    result = await session.execute(
        select(models.Measurement)
        .where(models.Measurement.user_id == user_id)
    )
    return list(result.scalars().all())
