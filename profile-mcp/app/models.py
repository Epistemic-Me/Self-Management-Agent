from sqlmodel import SQLModel, Field, Relationship
import uuid
from typing import Optional, List, Any
from datetime import datetime
from sqlalchemy.sql import func
from sqlalchemy import Column, JSON as SAJSON
from uuid import uuid4
from pydantic import BaseModel
import json

class User(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    dontdie_uid: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    self_models: List["SelfModel"] = Relationship(back_populates="user")
    measurements: List["Measurement"] = Relationship(back_populates="user")
    files: List["UserFile"] = Relationship(back_populates="user")
    trace_files: List["TraceFile"] = Relationship()
    conversations: List["Conversation"] = Relationship()
    dialectics: List["Dialectic"] = Relationship()

class SelfModel(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user: Optional[User] = Relationship(back_populates="self_models")
    belief_systems: List["BeliefSystem"] = Relationship(back_populates="self_model")
    dialectics: List["Dialectic"] = Relationship(back_populates="self_model")

class BeliefSystem(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    self_model_id: uuid.UUID = Field(foreign_key="selfmodel.id")
    name: str
    self_model: Optional[SelfModel] = Relationship(back_populates="belief_systems")
    beliefs: List["Belief"] = Relationship(back_populates="belief_system")

class Belief(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    belief_system_id: uuid.UUID = Field(foreign_key="beliefsystem.id")
    context_uuid: Optional[str]
    statement: str
    confidence: float
    belief_system: Optional[BeliefSystem] = Relationship(back_populates="beliefs")

class Measurement(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    type: str
    value: float
    unit: str
    captured_at: datetime
    user: Optional[User] = Relationship(back_populates="measurements")

class UserFile(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    s3_key: str
    mime: str
    sha256: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    user: Optional[User] = Relationship(back_populates="files")

class ChecklistItem(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    bucket_code: str
    status: str = Field(default="pending")
    data_ref: Optional[Any] = Field(default=None, sa_column=Column(SAJSON))
    source: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": func.now()})

    model_config = {
        "arbitrary_types_allowed": True
    }

class ProtocolTemplate(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    habit_type: str
    cue: str
    routine: str
    reward: str
    dd_protocol_json: Any = Field(sa_column=Column(SAJSON))
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "arbitrary_types_allowed": True
    }

class Conversation(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    started_at: datetime = Field(default_factory=datetime.utcnow)
    closed: bool = False
    meta: Optional[Any] = Field(default=None, sa_column=Column(SAJSON))
    
    # Relationships
    turns: List["Turn"] = Relationship(back_populates="conversation")
    dialectics: List["Dialectic"] = Relationship(back_populates="conversation")

    model_config = {
        "arbitrary_types_allowed": True
    }

class Turn(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(foreign_key="conversation.id")
    role: str  # "user" | "assistant" | "system"
    content: str
    extra_json: Optional[Any] = Field(default=None, sa_column=Column(SAJSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    conversation: Optional[Conversation] = Relationship(back_populates="turns")

    model_config = {
        "arbitrary_types_allowed": True
    }

class Dialectic(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    self_model_id: Optional[uuid.UUID] = Field(default=None, foreign_key="selfmodel.id")
    learning_objective: Optional[Any] = Field(default=None, sa_column=Column(SAJSON))
    started_at: datetime = Field(default_factory=datetime.utcnow)
    closed: bool = False
    conversation_id: Optional[uuid.UUID] = Field(default=None, foreign_key="conversation.id")
    
    # Relationships
    interactions: List["DialecticInteraction"] = Relationship(back_populates="dialectic")
    conversation: Optional[Conversation] = Relationship(back_populates="dialectics")
    self_model: Optional[SelfModel] = Relationship()

    model_config = {
        "arbitrary_types_allowed": True
    }

class DialecticInteraction(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid4, primary_key=True)
    dialectic_id: uuid.UUID = Field(foreign_key="dialectic.id")
    role: str  # "question" | "answer" | "system"
    content: str
    extra_json: Optional[Any] = Field(default=None, sa_column=Column(SAJSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    dialectic: Optional[Dialectic] = Relationship(back_populates="interactions")

    model_config = {
        "arbitrary_types_allowed": True
    }

# Simulation Job Schema
class SimRequest(BaseModel):
    user_id: uuid.UUID
    template: str = "default"

# Don't Die Data Models
class DDUserData(SQLModel, table=True):
    """Main table for storing a user's Don't Die data snapshot."""
    __tablename__ = "dd_user_data"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)  # Profile-MCP user ID
    dontdie_uid: str = Field(index=True)  # Don't Die user ID
    
    # Data snapshots (stored as JSON)
    measurements: Optional[str] = Field(default=None)  # JSON string
    capabilities: Optional[str] = Field(default=None)  # JSON string
    biomarkers: Optional[str] = Field(default=None)  # JSON string
    protocols: Optional[str] = Field(default=None)  # JSON string
    dd_scores: Optional[str] = Field(default=None)  # JSON string
    
    # Metadata
    last_synced: datetime = Field(default_factory=datetime.utcnow)
    sync_status: str = Field(default="pending")  # pending, success, error
    sync_error: Optional[str] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def get_measurements(self) -> list:
        """Get measurements as Python objects."""
        if not self.measurements:
            return []
        try:
            return json.loads(self.measurements)
        except json.JSONDecodeError:
            return []
    
    def set_measurements(self, data: list):
        """Store measurements as JSON string."""
        self.measurements = json.dumps(data) if data else None
        self.updated_at = datetime.utcnow()
    
    def get_capabilities(self) -> list:
        """Get capabilities as Python objects."""
        if not self.capabilities:
            return []
        try:
            return json.loads(self.capabilities)
        except json.JSONDecodeError:
            return []
    
    def set_capabilities(self, data: list):
        """Store capabilities as JSON string."""
        self.capabilities = json.dumps(data) if data else None
        self.updated_at = datetime.utcnow()
    
    def get_biomarkers(self) -> list:
        """Get biomarkers as Python objects."""
        if not self.biomarkers:
            return []
        try:
            return json.loads(self.biomarkers)
        except json.JSONDecodeError:
            return []
    
    def set_biomarkers(self, data: list):
        """Store biomarkers as JSON string."""
        self.biomarkers = json.dumps(data) if data else None
        self.updated_at = datetime.utcnow()
    
    def get_protocols(self) -> list:
        """Get protocols as Python objects."""
        if not self.protocols:
            return []
        try:
            return json.loads(self.protocols)
        except json.JSONDecodeError:
            return []
    
    def set_protocols(self, data: list):
        """Store protocols as JSON string."""
        self.protocols = json.dumps(data) if data else None
        self.updated_at = datetime.utcnow()
    
    def get_dd_scores(self) -> dict:
        """Get DD scores as Python objects."""
        if not self.dd_scores:
            return {}
        try:
            return json.loads(self.dd_scores)
        except json.JSONDecodeError:
            return {}
    
    def set_dd_scores(self, data: dict):
        """Store DD scores as JSON string."""
        self.dd_scores = json.dumps(data) if data else None
        self.updated_at = datetime.utcnow()

class DDSyncLog(SQLModel, table=True):
    """Log table for tracking data synchronization attempts."""
    __tablename__ = "dd_sync_log"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    sync_type: str  # full, incremental, single_endpoint
    endpoint: Optional[str] = Field(default=None)  # which endpoint was synced
    status: str  # started, success, error
    error_message: Optional[str] = Field(default=None)
    records_synced: int = Field(default=0)
    duration_ms: Optional[int] = Field(default=None)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TraceFile(SQLModel, table=True):
    """Table for storing uploaded trace files with validation metadata."""
    __tablename__ = "trace_file"
    
    id: uuid.UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    filename: str
    s3_key: str
    file_size: int
    mime_type: str
    quality_score: Optional[float] = None
    validation_status: str = Field(default="pending")  # pending, processing, completed, failed
    validation_errors: Optional[str] = None
    trace_count: Optional[int] = None  # Number of traces found in file
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
    
    # Relationships
    user: Optional[User] = Relationship()

    model_config = {
        "arbitrary_types_allowed": True
    }

class PromptVersion(SQLModel, table=True):
    """Table for storing prompt versions with testing history."""
    __tablename__ = "prompt_version"
    
    id: uuid.UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id")
    project_id: Optional[str] = None  # Links to project when project system is implemented
    system_prompt: str
    description: Optional[str] = None
    version: str = Field(default="v1.0")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional[User] = Relationship()
    test_sessions: List["PromptTestSession"] = Relationship(back_populates="prompt_version")

    model_config = {
        "arbitrary_types_allowed": True
    }

class PromptTestSession(SQLModel, table=True):
    """Table for storing prompt test sessions and results."""
    __tablename__ = "prompt_test_session"
    
    id: uuid.UUID = Field(default_factory=uuid4, primary_key=True)
    prompt_version_id: uuid.UUID = Field(foreign_key="prompt_version.id")
    test_messages: Optional[Any] = Field(default=None, sa_column=Column(SAJSON))  # Store test conversation
    session_notes: Optional[str] = None
    test_summary: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    prompt_version: Optional[PromptVersion] = Relationship(back_populates="test_sessions")

    model_config = {
        "arbitrary_types_allowed": True
    }

class PersonalizationContextCache(SQLModel, table=True):
    """Table for caching computed personalization context packages."""
    __tablename__ = "personalization_context_cache"
    
    id: uuid.UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    context_type: str = Field(index=True)  # evidence_gathering, protocol_recommendation, etc.
    context_data: Optional[Any] = Field(default=None, sa_column=Column(SAJSON))  # Computed context package
    token_count: int = Field(default=0)
    
    # Cache metadata
    data_sources: Optional[str] = None  # JSON list of data sources used
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime  # When this cache entry expires
    is_valid: bool = Field(default=True)
    
    # Relationships
    user: Optional[User] = Relationship()

    model_config = {
        "arbitrary_types_allowed": True
    }

class ContextRequirements(SQLModel, table=True):
    """Table for storing dynamic context configuration rules."""
    __tablename__ = "context_requirements"
    
    id: uuid.UUID = Field(default_factory=uuid4, primary_key=True)
    context_type: str = Field(index=True)  # Type of context this applies to
    data_source: str  # Data source (beliefs, measurements, biomarkers, etc.)
    requirement_type: str  # required, helpful, optional
    priority: int = Field(default=0)  # Priority order for inclusion (lower = higher priority)
    token_weight: float = Field(default=1.0)  # How much to prioritize in token allocation
    
    # Configuration rules
    max_items: Optional[int] = None  # Maximum items to include from this source
    freshness_hours: Optional[int] = None  # How fresh data needs to be (in hours)
    conditions: Optional[Any] = Field(default=None, sa_column=Column(SAJSON))  # Conditional rules
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": func.now()})
    is_active: bool = Field(default=True)

    model_config = {
        "arbitrary_types_allowed": True
    }

class PersonalizationMetrics(SQLModel, table=True):
    """Table for tracking personalization context performance metrics."""
    __tablename__ = "personalization_metrics"
    
    id: uuid.UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="user.id", index=True)
    context_type: str = Field(index=True)
    session_id: Optional[str] = None  # Health coach session ID if available
    
    # Performance metrics
    context_preparation_ms: int = Field(default=0)  # Time to prepare context
    token_utilization: float = Field(default=0.0)  # Percentage of token budget used
    data_sources_included: int = Field(default=0)  # Number of data sources included
    cache_hit: bool = Field(default=False)  # Whether cache was used
    
    # Quality metrics
    relevance_score: Optional[float] = None  # Computed relevance score (0-1)
    user_satisfaction: Optional[float] = None  # User feedback score if available
    effectiveness_score: Optional[float] = None  # Computed effectiveness metric
    
    # Context metadata
    context_size_tokens: int = Field(default=0)
    data_freshness_hours: Optional[float] = None  # Average age of data in hours
    compression_ratio: Optional[float] = None  # How much data was compressed
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional[User] = Relationship()

    model_config = {
        "arbitrary_types_allowed": True
    }
