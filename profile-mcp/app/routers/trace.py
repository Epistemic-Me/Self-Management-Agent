from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from app.deps import get_async_session, get_minio, get_current_user
from app.models import TraceFile, User
from app.services.trace_validation import TraceValidationService
import uuid
import os
from typing import List, Optional
from datetime import datetime
import hashlib
from io import BytesIO

router = APIRouter()

@router.post("/upload", tags=["trace"], operation_id="upload_trace_file")
async def upload_trace_file(
    background_tasks: BackgroundTasks,
    upload: UploadFile = FastAPIFile(...),
    session: Session = Depends(get_async_session),
    minio = Depends(get_minio),
    current_user: str = Depends(get_current_user),
):
    """Upload a trace file (CSV or JSON) for validation and processing."""
    
    # Get user
    result = await session.exec(select(User).where(User.dontdie_uid == current_user))
    user = result.first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Validate file type
    if not upload.content_type or upload.content_type not in ["text/csv", "application/json", "text/plain"]:
        raise HTTPException(
            status_code=400, 
            detail="Only CSV and JSON files are supported"
        )
    
    # Read file content
    content = await upload.read()
    file_size = len(content)
    
    # Generate S3 key
    ext = os.path.splitext(upload.filename)[-1]
    file_uuid = str(uuid.uuid4())
    s3_key = f"traces/{user.id}/{file_uuid}{ext}"
    
    # Upload to MinIO
    try:
        minio.upload_fileobj(
            Fileobj=BytesIO(content),
            Bucket="profile-files",
            Key=s3_key,
            ExtraArgs={"ContentType": upload.content_type},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
    
    # Create trace file record
    trace_file = TraceFile(
        user_id=user.id,
        filename=upload.filename,
        s3_key=s3_key,
        file_size=file_size,
        mime_type=upload.content_type,
        validation_status="pending"
    )
    
    session.add(trace_file)
    await session.commit()
    await session.refresh(trace_file)
    
    # Schedule validation in background
    background_tasks.add_task(validate_trace_file_background, trace_file.id, content)
    
    return {
        "status": "ok",
        "data": {
            "trace_file_id": str(trace_file.id),
            "s3_key": s3_key,
            "validation_status": "pending"
        }
    }

@router.get("/{trace_file_id}/status", tags=["trace"], operation_id="get_trace_validation_status")
async def get_trace_validation_status(
    trace_file_id: uuid.UUID,
    session: Session = Depends(get_async_session),
    current_user: str = Depends(get_current_user),
):
    """Get the validation status and results for a trace file."""
    
    # Get user
    result = await session.exec(select(User).where(User.dontdie_uid == current_user))
    user = result.first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get trace file
    result = await session.exec(
        select(TraceFile).where(
            TraceFile.id == trace_file_id,
            TraceFile.user_id == user.id
        )
    )
    trace_file = result.first()
    if not trace_file:
        raise HTTPException(status_code=404, detail="Trace file not found")
    
    return {
        "status": "ok",
        "data": {
            "trace_file_id": str(trace_file.id),
            "filename": trace_file.filename,
            "validation_status": trace_file.validation_status,
            "quality_score": trace_file.quality_score,
            "trace_count": trace_file.trace_count,
            "validation_errors": trace_file.validation_errors,
            "uploaded_at": trace_file.uploaded_at.isoformat(),
            "processed_at": trace_file.processed_at.isoformat() if trace_file.processed_at else None
        }
    }

@router.get("/list", tags=["trace"], operation_id="list_trace_files")
async def list_trace_files(
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_async_session),
    current_user: str = Depends(get_current_user),
):
    """List all trace files for the current user."""
    
    # Get user
    result = await session.exec(select(User).where(User.dontdie_uid == current_user))
    user = result.first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get trace files
    result = await session.exec(
        select(TraceFile)
        .where(TraceFile.user_id == user.id)
        .order_by(TraceFile.uploaded_at.desc())
        .offset(offset)
        .limit(limit)
    )
    trace_files = result.all()
    
    return {
        "status": "ok",
        "data": [
            {
                "trace_file_id": str(tf.id),
                "filename": tf.filename,
                "file_size": tf.file_size,
                "validation_status": tf.validation_status,
                "quality_score": tf.quality_score,
                "trace_count": tf.trace_count,
                "uploaded_at": tf.uploaded_at.isoformat(),
                "processed_at": tf.processed_at.isoformat() if tf.processed_at else None
            }
            for tf in trace_files
        ]
    }

async def validate_trace_file_background(trace_file_id: uuid.UUID, content: bytes):
    """Background task to validate trace file content."""
    from app.deps import get_async_session_factory
    
    async with get_async_session_factory()() as session:
        # Get trace file
        result = await session.exec(select(TraceFile).where(TraceFile.id == trace_file_id))
        trace_file = result.first()
        if not trace_file:
            return
        
        try:
            # Update status to processing
            trace_file.validation_status = "processing"
            await session.commit()
            
            # Validate the trace file
            validator = TraceValidationService()
            validation_result = await validator.validate_trace_content(content, trace_file.mime_type)
            
            # Update trace file with results
            trace_file.validation_status = "completed"
            trace_file.quality_score = validation_result.quality_score
            trace_file.trace_count = validation_result.trace_count
            trace_file.validation_errors = validation_result.errors_json
            trace_file.processed_at = datetime.utcnow()
            
            await session.commit()
            
        except Exception as e:
            # Update status to failed
            trace_file.validation_status = "failed"
            trace_file.validation_errors = str(e)
            trace_file.processed_at = datetime.utcnow()
            await session.commit()