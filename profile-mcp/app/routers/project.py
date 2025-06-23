"""
Project management router for handling project setup wizard functionality.
Includes project creation, draft management, and project lifecycle operations.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid
import json

from app.deps import get_session
from app.models import User

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Pydantic models for API requests/responses

class ProjectInfo(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=1000)
    type: str = Field(..., pattern="^(analysis|development|research)$")
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")

class Timeline(BaseModel):
    startDate: str
    estimatedDuration: str
    milestones: List[Dict[str, str]] = Field(default=[])

class ProjectManager(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

class TeamMember(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    role: str = Field(..., pattern="^(SME|Developer|Analyst)$")

class Stakeholders(BaseModel):
    projectManager: ProjectManager
    teamMembers: List[TeamMember] = Field(default=[])

class Requirements(BaseModel):
    objectives: List[str] = Field(default=[])
    constraints: List[str] = Field(default=[])
    success_criteria: List[str] = Field(default=[])

class NotificationSettings(BaseModel):
    email: bool = Field(default=True)
    slack: bool = Field(default=False)
    teams: bool = Field(default=False)

class Integration(BaseModel):
    githubRepo: Optional[str] = Field(default=None, pattern=r'^https://github\.com/[\w\-._]+/[\w\-._]+$')
    apiEndpoints: List[str] = Field(default=[])
    notifications: NotificationSettings = Field(default_factory=NotificationSettings)

class ProjectFormData(BaseModel):
    projectInfo: ProjectInfo
    timeline: Timeline
    stakeholders: Stakeholders
    requirements: Requirements
    integration: Integration

class ProjectDraftData(BaseModel):
    data: Dict[str, Any]
    lastSaved: Optional[str] = None

class ProjectDraftResponse(BaseModel):
    id: str
    userId: str
    data: Dict[str, Any]
    lastSaved: str
    stepCompleted: int

class CreatedProjectResponse(BaseModel):
    id: str
    name: str
    status: str
    createdAt: str
    phases: List[Dict[str, Any]]
    stakeholders: List[Dict[str, Any]]

# In-memory storage for demo purposes (replace with database in production)
project_drafts: Dict[str, Dict[str, Any]] = {}
created_projects: Dict[str, Dict[str, Any]] = {}

@router.post("/", response_model=CreatedProjectResponse)
async def create_project(
    project_data: ProjectFormData,
    session: Session = Depends(get_session)
) -> CreatedProjectResponse:
    """
    Create a new project from completed wizard data.
    This endpoint is called when the user completes all 5 steps of the wizard.
    """
    try:
        # Generate project ID
        project_id = str(uuid.uuid4())
        
        # Create project phases based on project type
        phases = create_default_phases(project_data.projectInfo.type)
        
        # Create stakeholder list
        stakeholders = []
        
        # Add project manager
        stakeholders.append({
            "id": str(uuid.uuid4()),
            "name": project_data.stakeholders.projectManager.name,
            "email": project_data.stakeholders.projectManager.email,
            "role": "Project Manager",
            "status": "active",
            "permissions": ["manage-project", "configure-system", "deploy-changes"]
        })
        
        # Add team members
        for member in project_data.stakeholders.teamMembers:
            stakeholders.append({
                "id": str(uuid.uuid4()),
                "name": member.name,
                "email": member.email,
                "role": member.role,
                "status": "pending",
                "permissions": get_role_permissions(member.role)
            })
        
        # Create project record
        project = {
            "id": project_id,
            "name": project_data.projectInfo.name,
            "description": project_data.projectInfo.description,
            "type": project_data.projectInfo.type,
            "priority": project_data.projectInfo.priority,
            "status": "active",
            "createdAt": datetime.utcnow().isoformat(),
            "timeline": project_data.timeline.dict(),
            "requirements": project_data.requirements.dict(),
            "integration": project_data.integration.dict(),
            "phases": phases,
            "stakeholders": stakeholders,
            "currentPhase": 1,
            "overallProgress": 0
        }
        
        # Store project (in production, save to database)
        created_projects[project_id] = project
        
        return CreatedProjectResponse(
            id=project_id,
            name=project_data.projectInfo.name,
            status="active",
            createdAt=project["createdAt"],
            phases=phases,
            stakeholders=stakeholders
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )

@router.post("/drafts", response_model=ProjectDraftResponse)
async def create_project_draft(
    draft_data: ProjectDraftData,
    session: Session = Depends(get_session)
) -> ProjectDraftResponse:
    """
    Create a new project draft for auto-save functionality.
    """
    try:
        draft_id = str(uuid.uuid4())
        user_id = "demo-user"  # In production, get from authenticated user
        
        draft = {
            "id": draft_id,
            "userId": user_id,
            "data": draft_data.data,
            "lastSaved": draft_data.lastSaved or datetime.utcnow().isoformat(),
            "stepCompleted": calculate_step_completed(draft_data.data)
        }
        
        project_drafts[draft_id] = draft
        
        return ProjectDraftResponse(**draft)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project draft: {str(e)}"
        )

@router.put("/drafts/{draft_id}", response_model=ProjectDraftResponse)
async def update_project_draft(
    draft_id: str,
    draft_data: ProjectDraftData,
    session: Session = Depends(get_session)
) -> ProjectDraftResponse:
    """
    Update an existing project draft.
    """
    if draft_id not in project_drafts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project draft not found"
        )
    
    try:
        draft = project_drafts[draft_id]
        draft.update({
            "data": draft_data.data,
            "lastSaved": draft_data.lastSaved or datetime.utcnow().isoformat(),
            "stepCompleted": calculate_step_completed(draft_data.data)
        })
        
        return ProjectDraftResponse(**draft)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project draft: {str(e)}"
        )

@router.get("/drafts/{draft_id}", response_model=ProjectDraftResponse)
async def get_project_draft(
    draft_id: str,
    session: Session = Depends(get_session)
) -> ProjectDraftResponse:
    """
    Retrieve a specific project draft.
    """
    if draft_id not in project_drafts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project draft not found"
        )
    
    return ProjectDraftResponse(**project_drafts[draft_id])

@router.get("/drafts", response_model=List[ProjectDraftResponse])
async def get_user_project_drafts(
    session: Session = Depends(get_session)
) -> List[ProjectDraftResponse]:
    """
    Get all project drafts for the current user.
    """
    user_id = "demo-user"  # In production, get from authenticated user
    
    user_drafts = [
        ProjectDraftResponse(**draft) 
        for draft in project_drafts.values() 
        if draft["userId"] == user_id
    ]
    
    return user_drafts

@router.delete("/drafts/{draft_id}")
async def delete_project_draft(
    draft_id: str,
    session: Session = Depends(get_session)
):
    """
    Delete a project draft.
    """
    if draft_id not in project_drafts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project draft not found"
        )
    
    del project_drafts[draft_id]
    return {"message": "Project draft deleted successfully"}

@router.post("/github/validate")
async def validate_github_repo(
    repo_data: Dict[str, str],
    session: Session = Depends(get_session)
):
    """
    Validate GitHub repository URL and check accessibility.
    """
    repo_url = repo_data.get("repoUrl", "")
    
    # Basic URL validation
    import re
    github_pattern = r'^https://github\.com/[\w\-._]+/[\w\-._]+$'
    
    if not re.match(github_pattern, repo_url):
        return {"valid": False, "error": "Invalid GitHub repository URL format"}
    
    # In production, you would make an actual API call to GitHub
    # For demo, we'll just validate the format
    return {"valid": True}

# Helper functions

def create_default_phases(project_type: str) -> List[Dict[str, Any]]:
    """Create default project phases based on project type."""
    base_phases = [
        {
            "id": 1,
            "name": "Foundation & Setup",
            "description": "Initial setup and configuration",
            "status": "active",
            "progress": 0,
            "estimatedDuration": "1-2 weeks",
            "keyDeliverables": ["Project setup", "Team onboarding"],
            "stakeholderFocus": ["Developer", "Project Manager"],
            "milestones": []
        }
    ]
    
    if project_type == "analysis":
        base_phases.extend([
            {
                "id": 2,
                "name": "Data Collection & Analysis",
                "description": "Gather and analyze project data",
                "status": "pending",
                "progress": 0,
                "estimatedDuration": "2-3 weeks",
                "keyDeliverables": ["Data collection", "Initial analysis"],
                "stakeholderFocus": ["Analyst", "SME"],
                "milestones": []
            }
        ])
    elif project_type == "development":
        base_phases.extend([
            {
                "id": 2,
                "name": "Development & Implementation",
                "description": "Core development work",
                "status": "pending",
                "progress": 0,
                "estimatedDuration": "4-6 weeks",
                "keyDeliverables": ["Core features", "Testing"],
                "stakeholderFocus": ["Developer"],
                "milestones": []
            }
        ])
    else:  # research
        base_phases.extend([
            {
                "id": 2,
                "name": "Research & Investigation",
                "description": "Research and exploration phase",
                "status": "pending",
                "progress": 0,
                "estimatedDuration": "3-5 weeks",
                "keyDeliverables": ["Research findings", "Documentation"],
                "stakeholderFocus": ["SME", "Analyst"],
                "milestones": []
            }
        ])
    
    # Add final phase
    base_phases.append({
        "id": len(base_phases) + 1,
        "name": "Deployment & Handover",
        "description": "Final deployment and project handover",
        "status": "pending",
        "progress": 0,
        "estimatedDuration": "1 week",
        "keyDeliverables": ["Deployment", "Documentation", "Training"],
        "stakeholderFocus": ["Developer", "Project Manager"],
        "milestones": []
    })
    
    return base_phases

def get_role_permissions(role: str) -> List[str]:
    """Get default permissions for a role."""
    permissions_map = {
        "SME": ["evaluate-traces", "create-rubrics", "validate-taxonomy"],
        "Developer": ["manage-code", "deploy-changes", "configure-system"],
        "Analyst": ["analyze-data", "generate-reports", "view-metrics"]
    }
    return permissions_map.get(role, [])

def calculate_step_completed(data: Dict[str, Any]) -> int:
    """Calculate which step was last completed based on form data."""
    if not data:
        return 0
    
    # Step 1: Project Info
    if "projectInfo" in data and data["projectInfo"].get("name"):
        step = 1
    else:
        return 0
    
    # Step 2: Timeline
    if "timeline" in data and data["timeline"].get("startDate"):
        step = 2
    else:
        return step
    
    # Step 3: Stakeholders
    if ("stakeholders" in data and 
        data["stakeholders"].get("projectManager", {}).get("name")):
        step = 3
    else:
        return step
    
    # Step 4: Requirements (optional, so we consider it complete if step 3 is done)
    step = 4
    
    # Step 5: Integration (optional, so we consider it complete)
    step = 5
    
    return step