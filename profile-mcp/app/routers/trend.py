from fastapi import APIRouter, Depends, Query
from typing import Optional
from uuid import UUID
from app.deps import async_session, get_redis, get_session
from sqlmodel import select
from datetime import datetime, timedelta
import numpy as np
import json

router = APIRouter()

@router.get("/getProgressTrend", operation_id="get_progress_trend")
async def get_progress_trend(
    user_id: UUID,
    metric: str,
    window: int = Query(7, ge=1, le=365),
    session=Depends(get_session),
    redis=Depends(get_redis)
):
    cache_key = f"trend:{user_id}:{metric}:{window}"
    cached = await redis.get(cache_key)
    if cached:
        # Deserialize the cached JSON data
        cached_data = json.loads(cached)
        return {"status": "ok", "data": cached_data}
    
    # Example: fetch daily measurements
    # TODO: implement metric fetch
    days = np.arange(window)
    values = np.random.normal(loc=50, scale=10, size=window)
    
    # Handle edge cases for linear regression
    if window == 1:
        slope = 0.0  # No trend with single point
    elif window == 2:
        # Simple slope calculation for two points
        slope = float(values[1] - values[0])
    else:
        # Use polyfit for 3+ points
        try:
            slope = float(np.polyfit(days, values, 1)[0])
        except np.linalg.LinAlgError:
            # Fallback if polyfit fails (e.g., all values are identical)
            slope = 0.0
    
    sparkline = values.tolist()
    result = {"slope": slope, "sparkline": sparkline}
    
    # Serialize the result to JSON before storing in Redis
    await redis.set(cache_key, json.dumps(result), ex=600)
    return {"status": "ok", "data": result}
