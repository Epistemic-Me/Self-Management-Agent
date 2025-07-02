"""
Chat models with provenance tracking
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import uuid4

from app.core.hierarchy import Cohort, IntentClass, Category, Constraint


class ChatMessage(BaseModel):
    """Chat message with metadata"""
    role: str  # user, assistant, system
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}


class RoutingDecision(BaseModel):
    """Result of hierarchical routing"""
    category: Category
    intent_class: IntentClass
    sub_intent_id: Optional[str] = None
    constraints: List[Constraint] = []
    confidence: float
    reasoning: str


class Provenance(BaseModel):
    """Provenance data for a response"""
    cohort: Cohort
    intent_class: IntentClass
    category: Category
    sub_intent: Optional[str] = None
    constraints_applied: List[Dict] = []
    confidence: float
    trace_id: str
    reasoning: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    def to_hierarchy_path(self) -> str:
        """Convert to hierarchy path string"""
        path_parts = [
            f"cohort:{self.cohort.value}",
            f"intent:{self.intent_class.value}",
            f"category:{self.category.value}"
        ]
        if self.sub_intent:
            path_parts.append(f"subintent:{self.sub_intent}")
        return " > ".join(path_parts)


class ChatRequest(BaseModel):
    """Request for chat endpoint"""
    message: str
    user_id: str
    session_id: Optional[str] = Field(default_factory=lambda: str(uuid4()))
    cohort: Optional[Cohort] = Cohort.HEALTH_ENTHUSIAST
    context: Optional[Dict[str, Any]] = {}
    include_provenance: bool = True


class ChatResponse(BaseModel):
    """Response from chat endpoint"""
    response: str
    session_id: str
    provenance: Optional[Provenance] = None
    metadata: Dict[str, Any] = {}


class ConversationTrace(BaseModel):
    """Full conversation trace for evaluation"""
    trace_id: str = Field(default_factory=lambda: str(uuid4()))
    session_id: str
    user_id: str
    messages: List[ChatMessage] = []
    routing_decisions: List[RoutingDecision] = []
    provenances: List[Provenance] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def to_evaluation_format(self) -> Dict:
        """Convert to format for open coding evaluation"""
        return {
            "trace_id": self.trace_id,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
            "conversation": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat(),
                    "provenance": next(
                        (p.dict() for p in self.provenances 
                         if p.timestamp >= msg.timestamp),
                        None
                    ) if msg.role == "assistant" else None
                }
                for msg in self.messages
            ],
            "hierarchy_paths": [
                p.to_hierarchy_path() for p in self.provenances
            ]
        }


class EvaluationRequest(BaseModel):
    """Request to evaluate a response against constraints"""
    response: str
    routing_decision: RoutingDecision
    original_query: str
    user_cohort: Cohort


class EvaluationResult(BaseModel):
    """Result of constraint evaluation"""
    passed: bool
    violations: List[Dict[str, Any]] = []
    suggestions: List[str] = []
    score: float = 0.0