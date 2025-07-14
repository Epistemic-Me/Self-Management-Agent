// Agent Evaluation Type Definitions
// Hierarchical Constraint Architecture for LLM evaluation

// DatasetFailureMode interface (defined in OpenCoding system)
export interface DatasetFailureMode {
  id: string;
  label: string;
  description: string;
  count: number;
  percentage: number;
  traces: string[];
  created_from_open_codes: string[]; // References to specific open code patterns
}

// Node types in the hierarchy
export type NodeType = 'root' | 'cohort' | 'intent' | 'category' | 'subintent' | 'sub_intent';

// Severity levels for failure modes and constraints
export type SeverityLevel = 'low' | 'medium' | 'high';

// Evaluation metrics interface
export interface EvaluationMetrics {
  success?: number; // 0-1 success rate
  coverage?: number; // 0-1 coverage percentage
  users?: number; // Number of users (for cohorts)
  queries?: number; // Number of queries processed
  [key: string]: number | undefined; // Allow custom metrics
}

// Constraint definition
export interface Constraint {
  id: string;
  text: string;
  category?: string; // e.g., "data_sources", "output_format", "scope_boundaries"
  validation_method?: string; // How to validate this constraint
}

// Failure mode with constraint association
export interface ConstraintFailureMode {
  id: string;
  name: string;
  description: string;
  severity: SeverityLevel;
  mitigation: string;
  constraint_violated?: string; // ID of the constraint that was violated
  detection_method?: string;
  traces?: string[]; // Trace IDs where this failure occurred
}

// Component type for sub-intents  
export type ComponentType = 'retriever' | 'tool';

// Agent hierarchy node
export interface AgentNode {
  id: string;
  name: string;
  type: NodeType;
  description?: string;
  icon?: string; // Emoji or icon identifier
  
  // Hierarchical relationships
  parent_id?: string;
  children?: AgentNode[];
  
  // Component information (for sub-intents)
  component_type?: ComponentType; // NEW: What type of component this is
  
  // Evaluation data
  metrics?: EvaluationMetrics;
  constraints?: Constraint[];
  failureModes?: ConstraintFailureMode[];
  
  // Additional metadata
  overview?: string;
  sampleQueries?: Array<{ id: string; text: string }>;
  evaluationMetrics?: Record<string, number>; // More detailed metrics
  
  // Configuration
  system_prompt?: string; // For sub-intents
  created_at?: string;
  updated_at?: string;
}

// Tier information for tooltips
export interface TierInfo {
  icon: string;
  title: string;
  description: string;
  example: string;
}

// Evaluation result linking to existing data
export interface EvaluationResult {
  node_id: string;
  dataset_id: string;
  execution_id: string;
  metrics: EvaluationMetrics;
  constraint_violations: Array<{
    constraint_id: string;
    violation_count: number;
    sample_traces: string[];
  }>;
  timestamp: string;
}

// Integration with existing failure modes
export interface LinkedFailureMode extends DatasetFailureMode {
  constraint_id?: string; // Link to constraint
  node_id?: string; // Link to hierarchy node
  evaluation_results?: EvaluationResult[];
}

// Configuration for constraint evaluation
export interface ConstraintEvaluator {
  id: string;
  name: string;
  description: string;
  evaluate: (trace: any, constraint: Constraint) => Promise<boolean>;
}

// Agent hierarchy structure for API
export interface AgentHierarchy {
  id: string;
  name: string;
  description: string;
  root_node: AgentNode;
  tier_info: Record<NodeType, TierInfo>;
  created_at: string;
  updated_at: string;
}

// Constraint template for quick creation
export interface ConstraintTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  template_constraints: Constraint[];
  applicable_node_types: NodeType[];
  predicted_failure_modes: Omit<ConstraintFailureMode, 'id' | 'traces'>[];
}

// Metrics tracking over time
export interface MetricsHistory {
  node_id: string;
  metrics: Array<{
    timestamp: string;
    values: EvaluationMetrics;
    dataset_id?: string;
    execution_id?: string;
  }>;
}

// Export tier definitions matching the prototype
export const DEFAULT_TIER_INFO: Record<NodeType, TierInfo> = {
  root: {
    icon: '🏥',
    title: 'Root Agent',
    description: 'Top-level agent definition with overall system metrics',
    example: 'Example: "AI Health Coach" - Complete health assistant system'
  },
  cohort: {
    icon: '👥',
    title: 'Cohort',
    description: 'User segments based on current habits and knowledge level. Defines baseline capabilities and appropriate complexity.',
    example: 'Example: "Health Enthusiast" - Regular exerciser with intermediate knowledge'
  },
  intent: {
    icon: '🎯',
    title: 'Intent Class',
    description: 'High-level user goals that cut across domains. Determines the type of interaction and expected outcome.',
    example: 'Example: "Evidence Research" - Seeking scientific backing for decisions'
  },
  category: {
    icon: '📂',
    title: 'Category',
    description: 'Domain-specific divisions. Each category has unique data sources and evaluation criteria.',
    example: 'Example: "Exercise" - Physical activity protocols and research'
  },
  subintent: {
    icon: '🔧',
    title: 'Sub-intent',
    description: 'Granular, specific handlers with precise constraints. Each has its own prompt and evaluation logic.',
    example: 'Example: "Meta-Analysis Review" - Synthesize multiple exercise studies'
  },
  sub_intent: {
    icon: '🔧',
    title: 'Sub-intent',
    description: 'Granular, specific handlers with precise constraints. Each has its own prompt and evaluation logic.',
    example: 'Example: "Meta-Analysis Review" - Synthesize multiple exercise studies'
  }
};