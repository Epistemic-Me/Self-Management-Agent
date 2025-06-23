"""
Prompt Management API Router

Handles prompt creation, versioning, testing, and management for LLM evaluation.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from uuid import UUID
import uuid
from datetime import datetime

from app.deps import get_session
from app.models import PromptVersion, PromptTestSession, User
from pydantic import BaseModel

router = APIRouter(prefix="/api/prompts", tags=["prompts"])

# Request/Response Models
class PromptVersionCreate(BaseModel):
    system_prompt: str
    description: Optional[str] = None
    version: str = "v1.0"
    project_id: Optional[str] = None

class PromptVersionUpdate(BaseModel):
    system_prompt: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class PromptTestSessionCreate(BaseModel):
    test_messages: List[Dict[str, Any]]
    session_notes: Optional[str] = None
    test_summary: Optional[str] = None

class PromptVersionResponse(BaseModel):
    id: UUID
    system_prompt: str
    description: Optional[str]
    version: str
    is_active: bool
    project_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    test_session_count: int

class PromptTestSessionResponse(BaseModel):
    id: UUID
    prompt_version_id: UUID
    test_messages: List[Dict[str, Any]]
    session_notes: Optional[str]
    test_summary: Optional[str]
    created_at: datetime

@router.post("/", response_model=PromptVersionResponse)
async def create_prompt_version(
    prompt_data: PromptVersionCreate,
    session: Session = Depends(get_session),
    # TODO: Add authentication when available
    # For now, create a mock user for testing
    user_id: UUID = uuid.uuid4()
) -> PromptVersionResponse:
    """Create a new prompt version."""
    
    # Deactivate other prompts for the same project if this one is active
    if prompt_data.project_id:
        existing_prompts = session.exec(
            select(PromptVersion).where(
                PromptVersion.user_id == user_id,
                PromptVersion.project_id == prompt_data.project_id,
                PromptVersion.is_active == True
            )
        ).all()
        
        for existing_prompt in existing_prompts:
            existing_prompt.is_active = False
            session.add(existing_prompt)
    
    # Create new prompt version
    prompt_version = PromptVersion(
        user_id=user_id,
        system_prompt=prompt_data.system_prompt,
        description=prompt_data.description,
        version=prompt_data.version,
        project_id=prompt_data.project_id,
        is_active=True
    )
    
    session.add(prompt_version)
    session.commit()
    session.refresh(prompt_version)
    
    return PromptVersionResponse(
        id=prompt_version.id,
        system_prompt=prompt_version.system_prompt,
        description=prompt_version.description,
        version=prompt_version.version,
        is_active=prompt_version.is_active,
        project_id=prompt_version.project_id,
        created_at=prompt_version.created_at,
        updated_at=prompt_version.updated_at,
        test_session_count=0
    )

@router.get("/", response_model=List[PromptVersionResponse])
async def list_prompt_versions(
    project_id: Optional[str] = None,
    active_only: bool = False,
    session: Session = Depends(get_session),
    # TODO: Add authentication when available
    # For now, create a mock user for testing
    user_id: UUID = uuid.uuid4()
) -> List[PromptVersionResponse]:
    """List prompt versions for the current user."""
    
    query = select(PromptVersion).where(PromptVersion.user_id == user_id)
    
    if project_id:
        query = query.where(PromptVersion.project_id == project_id)
    
    if active_only:
        query = query.where(PromptVersion.is_active == True)
    
    query = query.order_by(PromptVersion.updated_at.desc())
    
    prompt_versions = session.exec(query).all()
    
    # Count test sessions for each prompt
    result = []
    for pv in prompt_versions:
        test_session_count = session.exec(
            select(PromptTestSession).where(
                PromptTestSession.prompt_version_id == pv.id
            )
        ).count()
        
        result.append(PromptVersionResponse(
            id=pv.id,
            system_prompt=pv.system_prompt,
            description=pv.description,
            version=pv.version,
            is_active=pv.is_active,
            project_id=pv.project_id,
            created_at=pv.created_at,
            updated_at=pv.updated_at,
            test_session_count=test_session_count
        ))
    
    return result

@router.get("/{prompt_id}", response_model=PromptVersionResponse)
async def get_prompt_version(
    prompt_id: UUID,
    session: Session = Depends(get_session),
    # TODO: Add authentication when available
    # For now, create a mock user for testing
    user_id: UUID = uuid.uuid4()
) -> PromptVersionResponse:
    """Get a specific prompt version."""
    
    prompt_version = session.get(PromptVersion, prompt_id)
    if not prompt_version or prompt_version.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt version not found"
        )
    
    test_session_count = session.exec(
        select(PromptTestSession).where(
            PromptTestSession.prompt_version_id == prompt_id
        )
    ).count()
    
    return PromptVersionResponse(
        id=prompt_version.id,
        system_prompt=prompt_version.system_prompt,
        description=prompt_version.description,
        version=prompt_version.version,
        is_active=prompt_version.is_active,
        project_id=prompt_version.project_id,
        created_at=prompt_version.created_at,
        updated_at=prompt_version.updated_at,
        test_session_count=test_session_count
    )

@router.patch("/{prompt_id}", response_model=PromptVersionResponse)
async def update_prompt_version(
    prompt_id: UUID,
    prompt_update: PromptVersionUpdate,
    session: Session = Depends(get_session),
    # TODO: Add authentication when available
    # For now, create a mock user for testing
    user_id: UUID = uuid.uuid4()
) -> PromptVersionResponse:
    """Update a prompt version."""
    
    prompt_version = session.get(PromptVersion, prompt_id)
    if not prompt_version or prompt_version.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt version not found"
        )
    
    # Update fields if provided
    if prompt_update.system_prompt is not None:
        prompt_version.system_prompt = prompt_update.system_prompt
    if prompt_update.description is not None:
        prompt_version.description = prompt_update.description
    if prompt_update.is_active is not None:
        prompt_version.is_active = prompt_update.is_active
        
        # If activating this prompt, deactivate others in the same project
        if prompt_update.is_active and prompt_version.project_id:
            other_prompts = session.exec(
                select(PromptVersion).where(
                    PromptVersion.user_id == user_id,
                    PromptVersion.project_id == prompt_version.project_id,
                    PromptVersion.id != prompt_id,
                    PromptVersion.is_active == True
                )
            ).all()
            
            for other_prompt in other_prompts:
                other_prompt.is_active = False
                session.add(other_prompt)
    
    prompt_version.updated_at = datetime.utcnow()
    session.add(prompt_version)
    session.commit()
    session.refresh(prompt_version)
    
    test_session_count = session.exec(
        select(PromptTestSession).where(
            PromptTestSession.prompt_version_id == prompt_id
        )
    ).count()
    
    return PromptVersionResponse(
        id=prompt_version.id,
        system_prompt=prompt_version.system_prompt,
        description=prompt_version.description,
        version=prompt_version.version,
        is_active=prompt_version.is_active,
        project_id=prompt_version.project_id,
        created_at=prompt_version.created_at,
        updated_at=prompt_version.updated_at,
        test_session_count=test_session_count
    )

@router.post("/{prompt_id}/test-sessions", response_model=PromptTestSessionResponse)
async def create_test_session(
    prompt_id: UUID,
    session_data: PromptTestSessionCreate,
    session: Session = Depends(get_session),
    # TODO: Add authentication when available
    # For now, create a mock user for testing
    user_id: UUID = uuid.uuid4()
) -> PromptTestSessionResponse:
    """Create a test session for a prompt version."""
    
    # Verify prompt exists and belongs to user
    prompt_version = session.get(PromptVersion, prompt_id)
    if not prompt_version or prompt_version.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt version not found"
        )
    
    # Create test session
    test_session = PromptTestSession(
        prompt_version_id=prompt_id,
        test_messages=session_data.test_messages,
        session_notes=session_data.session_notes,
        test_summary=session_data.test_summary
    )
    
    session.add(test_session)
    session.commit()
    session.refresh(test_session)
    
    return PromptTestSessionResponse(
        id=test_session.id,
        prompt_version_id=test_session.prompt_version_id,
        test_messages=test_session.test_messages or [],
        session_notes=test_session.session_notes,
        test_summary=test_session.test_summary,
        created_at=test_session.created_at
    )

@router.get("/{prompt_id}/test-sessions", response_model=List[PromptTestSessionResponse])
async def list_test_sessions(
    prompt_id: UUID,
    session: Session = Depends(get_session),
    # TODO: Add authentication when available
    # For now, create a mock user for testing
    user_id: UUID = uuid.uuid4()
) -> List[PromptTestSessionResponse]:
    """List test sessions for a prompt version."""
    
    # Verify prompt exists and belongs to user
    prompt_version = session.get(PromptVersion, prompt_id)
    if not prompt_version or prompt_version.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt version not found"
        )
    
    test_sessions = session.exec(
        select(PromptTestSession)
        .where(PromptTestSession.prompt_version_id == prompt_id)
        .order_by(PromptTestSession.created_at.desc())
    ).all()
    
    return [
        PromptTestSessionResponse(
            id=ts.id,
            prompt_version_id=ts.prompt_version_id,
            test_messages=ts.test_messages or [],
            session_notes=ts.session_notes,
            test_summary=ts.test_summary,
            created_at=ts.created_at
        )
        for ts in test_sessions
    ]

@router.delete("/{prompt_id}")
async def delete_prompt_version(
    prompt_id: UUID,
    session: Session = Depends(get_session),
    # TODO: Add authentication when available
    # For now, create a mock user for testing
    user_id: UUID = uuid.uuid4()
):
    """Delete a prompt version and its test sessions."""
    
    prompt_version = session.get(PromptVersion, prompt_id)
    if not prompt_version or prompt_version.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt version not found"
        )
    
    # Delete test sessions first
    test_sessions = session.exec(
        select(PromptTestSession).where(
            PromptTestSession.prompt_version_id == prompt_id
        )
    ).all()
    
    for ts in test_sessions:
        session.delete(ts)
    
    # Delete prompt version
    session.delete(prompt_version)
    session.commit()
    
    return {"message": "Prompt version deleted successfully"}