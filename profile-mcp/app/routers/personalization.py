"""
API endpoints for personalization context management.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.deps import get_session, get_current_user
from app.models import (
    PersonalizationContextCache, ContextRequirements, PersonalizationMetrics,
    User
)
from app.services.personalization_context import PersonalizationContextManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/personalization", tags=["personalization"])

# Initialize the personalization manager
personalization_manager = PersonalizationContextManager()


class ContextRequest(BaseModel):
    """Request model for context preparation."""
    context_type: str = Field(..., description="Type of context to prepare")
    max_tokens: Optional[int] = Field(8000, description="Maximum tokens for context")
    force_refresh: Optional[bool] = Field(False, description="Force refresh cache")


class ContextResponse(BaseModel):
    """Response model for context data."""
    context_type: str
    user_id: str
    context_data: Dict[str, Any]
    metadata: Dict[str, Any]
    token_count: int
    cached: bool


class MetricsRequest(BaseModel):
    """Request model for recording context metrics."""
    context_type: str
    session_id: Optional[str] = None
    relevance_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    user_satisfaction: Optional[float] = Field(None, ge=0.0, le=1.0)
    effectiveness_score: Optional[float] = Field(None, ge=0.0, le=1.0)


@router.get("/contexts/{context_type}", response_model=ContextResponse)
async def get_personalization_context(
    context_type: str,
    max_tokens: int = Query(8000, ge=1000, le=16000),
    force_refresh: bool = Query(False),
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user)
):
    """
    Get personalized context data for a specific context type.
    
    Args:
        context_type: Type of context (evidence_gathering, protocol_recommendation, etc.)
        max_tokens: Maximum tokens to include in context
        force_refresh: Whether to bypass cache and generate fresh context
        session: Database session
        user_id: Current user ID
        
    Returns:
        Personalized context data package
    """
    try:
        start_time = datetime.utcnow()
        cached = False
        
        # Check cache first (unless force refresh)
        if not force_refresh:
            cache_entry = await _get_cached_context(session, user_id, context_type)
            if cache_entry and cache_entry.is_valid and cache_entry.expires_at > datetime.utcnow():
                cached = True
                context_data = cache_entry.context_data
                token_count = cache_entry.token_count
            else:
                context_data = None
        else:
            context_data = None
        
        # Generate fresh context if not cached
        if context_data is None:
            # Set max tokens on manager if different from default
            if max_tokens != 8000:
                personalization_manager.max_tokens = max_tokens
                personalization_manager.token_optimizer.max_tokens = max_tokens
            
            context_data = await personalization_manager.prepare_personalization_context(
                session, context_type, user_id
            )
            token_count = context_data.get('_metadata', {}).get('token_count', 0)
            
            # Cache the result
            await _cache_context(session, user_id, context_type, context_data, token_count)
        
        # Record performance metrics
        preparation_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        await _record_metrics(
            session, user_id, context_type, preparation_time, token_count, max_tokens, cached
        )
        
        return ContextResponse(
            context_type=context_type,
            user_id=user_id,
            context_data=context_data,
            metadata=context_data.get('_metadata', {}),
            token_count=token_count,
            cached=cached
        )
        
    except Exception as e:
        logger.error(f"Error getting personalization context: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user-data/{target_user_id}")
async def get_consolidated_user_data(
    target_user_id: str,
    include_sources: Optional[List[str]] = Query(None),
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user)
):
    """
    Get consolidated user data from all sources.
    
    Args:
        target_user_id: User to get data for
        include_sources: Specific data sources to include
        session: Database session
        user_id: Current user ID (for auth)
        
    Returns:
        Consolidated user data
    """
    try:
        # For now, only allow users to access their own data
        if target_user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Fetch all user data
        all_data = await personalization_manager._fetch_all_user_data(session, target_user_id)
        
        # Filter by requested sources if specified
        if include_sources:
            filtered_data = {k: v for k, v in all_data.items() if k in include_sources}
        else:
            filtered_data = all_data
        
        return {
            "user_id": target_user_id,
            "data": filtered_data,
            "available_sources": list(all_data.keys()),
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting consolidated user data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate-context")
async def evaluate_context_performance(
    metrics: MetricsRequest,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user)
):
    """
    Record evaluation metrics for a context's performance.
    
    Args:
        metrics: Performance metrics to record
        session: Database session
        user_id: Current user ID
        
    Returns:
        Success confirmation
    """
    try:
        # Update existing metrics record or create new one
        # First try to find recent metrics record for this context
        recent_cutoff = datetime.utcnow() - timedelta(minutes=30)
        stmt = select(PersonalizationMetrics).where(
            PersonalizationMetrics.user_id == user_id,
            PersonalizationMetrics.context_type == metrics.context_type,
            PersonalizationMetrics.created_at > recent_cutoff
        ).order_by(PersonalizationMetrics.created_at.desc()).limit(1)
        
        result = await session.execute(stmt)
        existing_metrics = result.scalar_one_or_none()
        
        if existing_metrics:
            # Update existing record
            if metrics.relevance_score is not None:
                existing_metrics.relevance_score = metrics.relevance_score
            if metrics.user_satisfaction is not None:
                existing_metrics.user_satisfaction = metrics.user_satisfaction
            if metrics.effectiveness_score is not None:
                existing_metrics.effectiveness_score = metrics.effectiveness_score
            if metrics.session_id:
                existing_metrics.session_id = metrics.session_id
        else:
            # Create new metrics record
            new_metrics = PersonalizationMetrics(
                user_id=UUID(user_id),
                context_type=metrics.context_type,
                session_id=metrics.session_id,
                relevance_score=metrics.relevance_score,
                user_satisfaction=metrics.user_satisfaction,
                effectiveness_score=metrics.effectiveness_score
            )
            session.add(new_metrics)
        
        await session.commit()
        
        return {"status": "success", "message": "Metrics recorded successfully"}
        
    except Exception as e:
        logger.error(f"Error evaluating context performance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/{target_user_id}")
async def get_personalization_metrics(
    target_user_id: str,
    context_type: Optional[str] = Query(None),
    days: int = Query(7, ge=1, le=90),
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user)
):
    """
    Get personalization performance metrics for a user.
    
    Args:
        target_user_id: User to get metrics for
        context_type: Specific context type to filter by
        days: Number of days to look back
        session: Database session
        user_id: Current user ID (for auth)
        
    Returns:
        Performance metrics and analysis
    """
    try:
        # For now, only allow users to access their own metrics
        if target_user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Build query
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        stmt = select(PersonalizationMetrics).where(
            PersonalizationMetrics.user_id == target_user_id,
            PersonalizationMetrics.created_at > cutoff_date
        )
        
        if context_type:
            stmt = stmt.where(PersonalizationMetrics.context_type == context_type)
        
        stmt = stmt.order_by(PersonalizationMetrics.created_at.desc())
        
        result = await session.execute(stmt)
        metrics = result.scalars().all()
        
        # Aggregate metrics
        if metrics:
            total_requests = len(metrics)
            avg_preparation_time = sum(m.context_preparation_ms for m in metrics) / total_requests
            avg_token_utilization = sum(m.token_utilization for m in metrics) / total_requests
            cache_hit_rate = sum(1 for m in metrics if m.cache_hit) / total_requests
            
            # Quality metrics (only for records that have them)
            relevance_scores = [m.relevance_score for m in metrics if m.relevance_score is not None]
            satisfaction_scores = [m.user_satisfaction for m in metrics if m.user_satisfaction is not None]
            effectiveness_scores = [m.effectiveness_score for m in metrics if m.effectiveness_score is not None]
            
            summary = {
                "total_requests": total_requests,
                "avg_preparation_time_ms": round(avg_preparation_time, 2),
                "avg_token_utilization": round(avg_token_utilization, 3),
                "cache_hit_rate": round(cache_hit_rate, 3),
                "avg_relevance_score": round(sum(relevance_scores) / len(relevance_scores), 3) if relevance_scores else None,
                "avg_satisfaction_score": round(sum(satisfaction_scores) / len(satisfaction_scores), 3) if satisfaction_scores else None,
                "avg_effectiveness_score": round(sum(effectiveness_scores) / len(effectiveness_scores), 3) if effectiveness_scores else None
            }
        else:
            summary = {
                "total_requests": 0,
                "message": "No metrics found for the specified period"
            }
        
        # Context type breakdown
        context_breakdown = {}
        for metric in metrics:
            ctx_type = metric.context_type
            if ctx_type not in context_breakdown:
                context_breakdown[ctx_type] = []
            context_breakdown[ctx_type].append(metric)
        
        return {
            "user_id": target_user_id,
            "period_days": days,
            "context_type_filter": context_type,
            "summary": summary,
            "context_breakdown": {
                ctx: len(records) for ctx, records in context_breakdown.items()
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting personalization metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/cache/{context_type}")
async def clear_context_cache(
    context_type: str,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user)
):
    """
    Clear cached context data for a specific context type.
    
    Args:
        context_type: Context type to clear cache for
        session: Database session
        user_id: Current user ID
        
    Returns:
        Success confirmation
    """
    try:
        # Mark cache entries as invalid
        stmt = select(PersonalizationContextCache).where(
            PersonalizationContextCache.user_id == user_id,
            PersonalizationContextCache.context_type == context_type,
            PersonalizationContextCache.is_valid == True
        )
        
        result = await session.execute(stmt)
        cache_entries = result.scalars().all()
        
        for entry in cache_entries:
            entry.is_valid = False
        
        await session.commit()
        
        return {
            "status": "success",
            "message": f"Cleared {len(cache_entries)} cache entries for context type '{context_type}'"
        }
        
    except Exception as e:
        logger.error(f"Error clearing context cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper functions

async def _get_cached_context(
    session: AsyncSession, 
    user_id: str, 
    context_type: str
) -> Optional[PersonalizationContextCache]:
    """Get cached context if available and valid."""
    stmt = select(PersonalizationContextCache).where(
        PersonalizationContextCache.user_id == user_id,
        PersonalizationContextCache.context_type == context_type,
        PersonalizationContextCache.is_valid == True
    ).order_by(PersonalizationContextCache.created_at.desc()).limit(1)
    
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def _cache_context(
    session: AsyncSession,
    user_id: str,
    context_type: str,
    context_data: Dict[str, Any],
    token_count: int
):
    """Cache context data for future use."""
    try:
        # Cache expires in 1 hour by default
        expires_at = datetime.utcnow() + timedelta(hours=1)
        
        cache_entry = PersonalizationContextCache(
            user_id=UUID(user_id),
            context_type=context_type,
            context_data=context_data,
            token_count=token_count,
            data_sources=','.join(context_data.get('_metadata', {}).get('data_sources', [])),
            expires_at=expires_at
        )
        
        session.add(cache_entry)
        await session.commit()
        
    except Exception as e:
        logger.error(f"Error caching context: {str(e)}")
        # Don't fail the request if caching fails


async def _record_metrics(
    session: AsyncSession,
    user_id: str,
    context_type: str,
    preparation_time_ms: float,
    token_count: int,
    max_tokens: int,
    cache_hit: bool
):
    """Record performance metrics for context preparation."""
    try:
        token_utilization = token_count / max_tokens if max_tokens > 0 else 0
        
        metrics = PersonalizationMetrics(
            user_id=UUID(user_id),
            context_type=context_type,
            context_preparation_ms=int(preparation_time_ms),
            token_utilization=token_utilization,
            cache_hit=cache_hit,
            context_size_tokens=token_count
        )
        
        session.add(metrics)
        await session.commit()
        
    except Exception as e:
        logger.error(f"Error recording metrics: {str(e)}")
        # Don't fail the request if metrics recording fails