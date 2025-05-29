from datetime import datetime
from typing import Dict, Any, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Job(BaseModel):
    """Schema for simulation job messages in Redis queue"""
    
    job_id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str = Field(..., description="User ID for the simulation")
    template: str = Field(..., description="Conversation template type")
    simulation_type: str = Field(default="conversation", description="Type of simulation")
    simulation_config: Dict[str, Any] = Field(
        default_factory=dict,
        description="Configuration parameters for the simulation"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    priority: int = Field(default=1, description="Job priority (1=highest, 10=lowest)")
    retry_count: int = Field(default=0, description="Number of retry attempts")
    max_retries: int = Field(default=3, description="Maximum retry attempts")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v)
        }


class SimulationResult(BaseModel):
    """Schema for simulation results"""
    
    job_id: str
    conversation_id: Optional[str] = None
    status: str = Field(..., description="success, failed, or error")
    transcript_turns: int = Field(default=0)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    error_message: Optional[str] = None
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ConversationTurn(BaseModel):
    """Schema for individual conversation turns"""
    
    role: str = Field(..., description="Role: user, assistant, or system")
    content: str = Field(..., description="Turn content/message")
    extra: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 