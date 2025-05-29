"""
Proto adapter for converting between Epistemic Me Protobuf models and Pydantic models.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class BeliefModel(BaseModel):
    """Pydantic model for Belief data."""
    model_config = ConfigDict()
    
    id: Optional[str] = None
    belief_system_id: str
    statement: str
    confidence: float
    context_uuid: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class BeliefSystemModel(BaseModel):
    """Pydantic model for BeliefSystem data."""
    model_config = ConfigDict()
    
    id: Optional[str] = None
    self_model_id: str
    name: str
    beliefs: List[BeliefModel] = []
    created_at: Optional[datetime] = None


class DialecticalInteractionModel(BaseModel):
    """Pydantic model for DialecticalInteraction data."""
    model_config = ConfigDict()
    
    id: Optional[str] = None
    status: Optional[str] = None
    type: Optional[str] = None
    interaction: Optional[Dict[str, Any]] = None
    prediction_context: Optional[Dict[str, Any]] = None
    perspectives: List[Dict[str, Any]] = []
    updated_at_millis_utc: Optional[int] = None


class LearningObjectiveModel(BaseModel):
    """Pydantic model for LearningObjective data."""
    model_config = ConfigDict()
    
    description: str
    topics: List[str] = []
    target_belief_type: Optional[str] = None
    completion_percentage: Optional[float] = 0.0


class AgentModel(BaseModel):
    """Pydantic model for Agent data."""
    model_config = ConfigDict()
    
    agent_type: Optional[str] = None
    dialectic_type: Optional[str] = None


class DialecticModel(BaseModel):
    """Pydantic model for Dialectic data."""
    model_config = ConfigDict()
    
    id: Optional[str] = None
    self_model_id: str
    agent: Optional[AgentModel] = None
    user_interactions: List[DialecticalInteractionModel] = []
    learning_objective: Optional[LearningObjectiveModel] = None
    perspective_model_ids: List[str] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SelfModelModel(BaseModel):
    """Pydantic model for SelfModel data."""
    model_config = ConfigDict()
    
    id: Optional[str] = None
    user_id: str
    name: Optional[str] = None
    belief_systems: List[BeliefSystemModel] = []
    dialectics: List[DialecticModel] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


def proto_to_self_model(proto_data: Dict[str, Any]) -> SelfModelModel:
    """Convert Protobuf SelfModel data to Pydantic model."""
    return SelfModelModel(**proto_data)


def proto_to_belief(proto_data: Dict[str, Any]) -> BeliefModel:
    """Convert Protobuf Belief data to Pydantic model."""
    return BeliefModel(**proto_data)


def proto_to_belief_system(proto_data: Dict[str, Any]) -> BeliefSystemModel:
    """Convert Protobuf BeliefSystem data to Pydantic model."""
    return BeliefSystemModel(**proto_data)


def proto_to_dialectic(proto_data: Dict[str, Any]) -> DialecticModel:
    """Convert Protobuf Dialectic data to Pydantic model."""
    return DialecticModel(**proto_data)


def self_model_to_dict(model: SelfModelModel) -> Dict[str, Any]:
    """Convert SelfModel to dictionary for JSON serialization."""
    data = model.model_dump(exclude_none=True)
    
    def convert_datetime_recursive(obj):
        """Recursively convert datetime objects to ISO strings."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: convert_datetime_recursive(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_datetime_recursive(item) for item in obj]
        return obj
    
    return convert_datetime_recursive(data)


def belief_to_dict(model: BeliefModel) -> Dict[str, Any]:
    """Convert Belief to dictionary for JSON serialization."""
    data = model.model_dump(exclude_none=True)
    
    def convert_datetime_recursive(obj):
        """Recursively convert datetime objects to ISO strings."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: convert_datetime_recursive(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_datetime_recursive(item) for item in obj]
        return obj
    
    return convert_datetime_recursive(data)


def belief_system_to_dict(model: BeliefSystemModel) -> Dict[str, Any]:
    """Convert BeliefSystem to dictionary for JSON serialization."""
    data = model.model_dump(exclude_none=True)
    
    def convert_datetime_recursive(obj):
        """Recursively convert datetime objects to ISO strings."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: convert_datetime_recursive(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_datetime_recursive(item) for item in obj]
        return obj
    
    return convert_datetime_recursive(data)


def dialectic_to_dict(model: DialecticModel) -> Dict[str, Any]:
    """Convert Dialectic to dictionary for JSON serialization."""
    data = model.model_dump(exclude_none=True)
    
    def convert_datetime_recursive(obj):
        """Recursively convert datetime objects to ISO strings."""
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, dict):
            return {k: convert_datetime_recursive(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_datetime_recursive(item) for item in obj]
        return obj
    
    return convert_datetime_recursive(data) 