/**
 * Types for Health Coach Agent integration
 */

export interface Cohort {
  id: string;
  name: string;
  description: string;
  complexity_level: string;
  allowed_intents: string[];
}

export interface Constraint {
  id: string;
  type: string;
  description: string;
  severity: string;
}

export interface Provenance {
  cohort: string;
  intent_class: string;
  category: string;
  sub_intent?: string;
  constraints_applied: Constraint[];
  confidence: number;
  trace_id: string;
  reasoning: string;
  timestamp: string;
}

export interface HealthCoachResponse {
  response: string;
  session_id: string;
  provenance?: Provenance;
  metadata: {
    trace_id: string;
    confidence: number;
  };
}

export interface ChatRequest {
  message: string;
  user_id: string;
  session_id?: string;
  cohort?: string;
  context?: Record<string, any>;
  include_provenance?: boolean;
}

export interface ProvenanceDisplay {
  hierarchyPath: string;
  confidence: number;
  constraints: string[];
  reasoning: string;
}