# Implementation Plan: Epistemic Me LLM Evaluation & Personalization Platform

## Executive Summary

This document outlines the comprehensive plan to evolve the Self-Management-Agent into a sophisticated LLM evaluation platform with Epistemic Me personalization capabilities. The plan follows the customer journey defined in `customer_journey.md` while building upon the existing web-ui foundation with Chat, Evaluation, and Workbench views.

### Core Innovation Strategy

**UPDATED**: Focus on **Client-Driven Reusable Tasks** with flexible workflow paths:

#### **Architecture Decision**: Reusable Client Engagement Tasks
- Build as trackable client engagement workflows (not generic SDK features)
- Enable systematic reuse across multiple client projects  
- Support both **Input-Focused** and **Output-Focused** analysis paths

#### **Incremental INPUT Complexity Framework**:
- **Level 1**: Basic traces `{query, response, timestamp}`
- **Level 2**: + Cohort & Intent `{query, response, user_cohort, intent, timestamp}`
- **Level 3**: + Self-Model & Beliefs `{query, response, user_context, self_model, beliefs, timestamp}`
- **Level 4**: + Full Epistemic Context `{query, response, full_user_context, epistemic_context, causal_map, timestamp}`

#### **Client Decision Framework**:
- **Input Focus**: User understanding, personalization, belief alignment
- **Output Focus**: Error analysis, failure modes, quality improvement
- **Decision Point**: After terminology training based on client context

---

## Current State Analysis

### Existing Infrastructure
- **web-ui**: Next.js application with Chat, Evaluation, and Workbench views
- **profile-mcp**: User profile and data management (Port 8010)
- **em-mcp**: Epistemic Me integration for dialectics (Port 8120)  
- **profile-mcp-eval**: Background worker for conversation evaluation
- **DD-MCP**: Don't Die API integration (Port 8090)

### Existing Capabilities
- ✅ Basic chat interface with conversation storage
- ✅ Conversation list and detail views for evaluation
- ✅ User profile management with belief systems
- ✅ Integration with Epistemic Me SDK for self-models
- ✅ PostgreSQL/Redis/MinIO storage infrastructure

### Gaps to Address
- ❌ Systematic trace collection and analysis
- ❌ Open coding interface for collaborative labeling
- ❌ LLM judge training and calibration
- ❌ Failure mode taxonomy and analysis
- ❌ Client-specific project management
- ❌ Personalization metrics and analytics
- ❌ Recommendation system integration

---

## Phase 1: Core Evaluation Loop & Foundation  
*Timeline: 4-5 weeks | Maps to "Instant Value + Initial Audit Phase"*
*RESTRUCTURED: Prioritizes immediate evaluation loop for quick time-to-value*

### User Experience Overview - Phase 1

**CORE INSIGHT**: Following the AI Evals Course homework progression, clients need to experience the full evaluation improvement loop immediately - not just data collection. The UI prioritizes the cycle: **Setup Prompt → Test Chat → Evaluate → Iterate** within 15 minutes.

### **Evaluation Loop First Strategy**
```
Traditional Approach: Setup → Collect Data → Eventually Evaluate
New Approach:        Setup → Test Immediately → Evaluate → Improve → Repeat
```

#### Client-Facing UI Experience:

**🎯 Client Onboarding Dashboard**
```
┌─────────────────────────────────────────────────────────────┐
│ Welcome to Epistemic Me Evaluation Platform                │
├─────────────────────────────────────────────────────────────┤
│ Project Setup Progress                           [75% ████░] │
│                                                             │
│ ✅ 1. Account Creation & Team Access                        │
│ ✅ 2. Project Repository Setup                              │
│ ✅ 3. Initial Trace Collection                              │
│ ⏳ 4. Terminology Training (In Progress)                    │
│ ⏸️ 5. Kickoff Call Scheduling                               │
│                                                             │
│ [Continue Setup] [Schedule Support Call] [View Guide]      │
└─────────────────────────────────────────────────────────────┘
```

**📊 Trace Collection Interface**
```
┌─────────────────────────────────────────────────────────────┐
│ Trace Collection Hub                                        │
├─────────────────────────────────────────────────────────────┤
│ Upload Method:                                              │
│ ○ CSV File Upload    ○ API Integration    ○ Manual Entry   │
│                                                             │
│ Current Dataset:     1,247 traces collected                │
│ Target Goal:         1,000+ traces                         │
│ Quality Score:       87% (Good)                            │
│                                                             │
│ ┌─ Recent Uploads ────────────────────────────────────────┐ │
│ │ customer_support_logs.csv        (+450 traces)         │ │
│ │ chatbot_conversations_nov.json   (+332 traces)         │ │
│ │ user_feedback_traces.xlsx        (+215 traces)         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Upload New Traces] [Validate Dataset] [Export Sample]     │
└─────────────────────────────────────────────────────────────┘
```

#### Internal Team UI Experience:

**🏢 Epistemic Me Project Management Dashboard**
```
┌─────────────────────────────────────────────────────────────┐
│ Client Projects Overview                                    │
├─────────────────────────────────────────────────────────────┤
│ Active Projects (5)                                         │
│                                                             │
│ ┌─ TechCorp Chatbot Eval ──────── Phase 1 ── On Track ───┐ │
│ │ Client Lead: Sarah Chen                                 │ │
│ │ Traces: 1,247/1,000+ ✅  GitHub: Created ✅  Call: Pending│ │
│ │ [View Project] [Message Client] [Schedule Call]        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ HealthBot Inc ─────────── Phase 2 ── Blocked ────────┐ │
│ │ Client Lead: Dr. Martinez                               │ │
│ │ Issue: Waiting for SME availability                    │ │
│ │ [Resolve Block] [Contact Client] [Escalate]           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Epic 1.1: Instant Evaluation Loop (HIGHEST PRIORITY)
*Timeline: 2-3 weeks | Immediate Value Delivery*

**Objective**: Enable users to experience prompt improvement value within 15 minutes of setup

**CORE USER JOURNEY**:
```
Project Setup → Chat & Generate → Evaluate → Iterate
    (5 min)       (5 min)         (3 min)    (2 min)
```

**KEY INSIGHT**: Following the AI Evals Course homework progression, users must immediately experience the improvement loop, not just data collection.

#### Strategic Priorities:
- **Immediate Value**: Users see prompt improvement within 15 minutes
- **Natural Workflow**: Seamless flow from setup → testing → evaluation → iteration
- **Learning-by-Doing**: Hands-on evaluation experience, not theory

#### Key Components:
- **Enhanced Project Setup**: Prompt configuration with immediate testing capability
- **Chat-to-Evaluation Pipeline**: Auto-capture traces, one-click evaluation launch
- **Rapid Iteration Interface**: Side-by-side prompt editing, comparison, and improvement
- **Improvement Feedback Loop**: AI-powered suggestions based on evaluation results

#### Technical Implementation:
```typescript
// Enhanced existing routes for evaluation loop
/src/app/
├── project-setup/
│   ├── prompt-configuration/    # NEW: Define chatbot behavior
│   ├── test-workbench/         # NEW: Immediate prompt testing
│   └── evaluation-preview/     # NEW: Quick evaluation setup
├── chat/
│   ├── evaluation-aware/       # ENHANCED: Auto-capture traces
│   └── improvement-actions/    # NEW: Quick iteration tools
├── evaluation/
│   ├── prompt-comparison/      # NEW: Version comparison
│   ├── improvement-suggestions/ # NEW: AI-powered recommendations
│   └── iteration-workflow/     # NEW: Rapid improvement cycle
```

#### Feature Breakdown:
**Feature 1.1.1: Enhanced Project Setup with Prompt Testing**
- Prompt configuration interface in project setup wizard
- Integrated testing chat within setup flow
- Auto-capture of setup testing traces
- One-click transition to evaluation

**Feature 1.1.2: Chat-to-Evaluation Pipeline**
- Auto-trace capture in chat interface
- One-click evaluation from chat sessions
- Session-based trace organization
- Immediate quality scoring and feedback

**Feature 1.1.3: Rapid Iteration Interface**
- Prompt version tracking and history
- Side-by-side trace comparison
- AI-powered improvement suggestions
- Quick prompt iteration workflow

#### Backend Enhancements:
- **Enhanced**: `profile-mcp` with prompt versioning and evaluation integration
- **New models**: PromptVersion, EvaluationSession, ImprovementSuggestion
- **Integration**: Real-time evaluation pipeline

#### Deliverables:
1. ✅ Enhanced project setup with prompt testing workbench
2. ✅ Chat interface with evaluation integration
3. ✅ Prompt iteration and comparison interface
4. ✅ Improvement suggestion system
5. ✅ Seamless evaluation loop workflow

### Epic 1.2: Systematic Trace Management (SECONDARY PRIORITY)
*Timeline: 1-2 weeks | Scaling Value*

**Objective**: Scale the evaluation loop with better data management and bulk capabilities

**REPOSITIONED**: This epic now supports the core evaluation loop rather than being a standalone feature.

#### Key Components:
- **Contextual Trace Import**: Move trace collection INTO project context, not standalone
- **Dataset Evolution Tracking**: Version tracking for prompt changes and trace lineage
- **Bulk Evaluation Support**: Import large datasets for comprehensive evaluation
- **Export for Analysis**: Support advanced evaluation workflows and external tools

#### Feature Breakdown:
**Feature 1.2.1: Contextual Trace Import**
- Move trace collection into project context (remove standalone tab)
- Bulk import integrated with prompt testing workflows
- Automatic trace categorization by prompt version
- Import validation aligned with project evaluation goals

**Feature 1.2.2: Dataset Evolution Tracking**
- Version tracking for prompt changes and iterations
- Trace lineage (which prompt generated which traces)
- Export datasets by prompt version or quality score
- Historical comparison of prompt performance

#### Technical Implementation:
- **Enhanced**: Existing trace collection system integrated into project workflows
- **New models**: PromptTraceLineage, DatasetVersion, EvaluationHistory
- **UI Changes**: Remove standalone "Trace Collection" tab, integrate into project setup and evaluation flows

### Epic 1.3: Collaborative Evaluation (TERTIARY PRIORITY)
*Timeline: 1-2 weeks | Team Scaling*

**Objective**: Enable team-based evaluation and improvement workflows

**REPOSITIONED**: Supports team collaboration on the core evaluation loop.

#### Key Components:
- **Team Access**: Multi-user project collaboration and role management
- **Review Workflows**: Structured evaluation processes and approval flows
- **Progress Tracking**: Team evaluation metrics and performance analytics
- **GitHub Integration**: Associate repos with projects, sync evaluation progress

#### Feature Breakdown:
**Feature 1.3.1: Team Collaboration**
- Multi-user access to projects and evaluation workflows
- Role-based permissions (Admin, Evaluator, Viewer)
- Collaborative prompt improvement suggestions
- Team progress tracking and analytics

**Feature 1.3.2: GitHub Integration** (addresses original requirement)
- Associate GitHub repositories with evaluation projects
- Sync evaluation progress with GitHub issues and milestones
- Export evaluation results to GitHub project boards
- Issue template automation for evaluation workflows

#### Technical Implementation:
```python
# New GitHub service endpoints
POST /api/github/validate-repo
POST /api/github/create-project  
POST /api/github/sync-status
GET /api/github/rate-limits
```

#### Database Schema:
```sql
ALTER TABLE client_projects ADD COLUMN github_integration JSONB;
ALTER TABLE client_projects ADD COLUMN github_repo_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE client_projects ADD COLUMN github_project_id INTEGER;

CREATE TABLE github_configurations (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id),
    encrypted_token TEXT,
    permissions JSONB,
    rate_limit_status JSONB,
    last_sync TIMESTAMP DEFAULT NOW()
);
```

### Epic 1.4: User-Based Open Coding Foundation

**Objective**: Enable organizing and tracking open coding activities by individual users

**ADDRESSES REQUIREMENT**: Access users for open coding notes by user

#### Key Components:
- **User Management**: Associate traces with annotators, role-based access (SME, Developer, Analyst)
- **Trace Organization**: Filter by user, individual annotation queues, progress tracking
- **Session Management**: Track coding sessions, productivity metrics, concurrent annotations
- **Assignment Workflows**: Assign traces to users, monitor completion rates

#### Technical Implementation:
```python
# New user management endpoints
POST /api/projects/{project_id}/users
GET /api/projects/{project_id}/users
POST /api/projects/{project_id}/assign-traces
GET /api/users/{user_id}/coding-queue
POST /api/users/{user_id}/start-session
PUT /api/users/{user_id}/complete-trace
```

#### Database Schema:
```sql
CREATE TABLE annotation_users (
    id UUID PRIMARY KEY,
    client_project_id UUID REFERENCES client_projects(id),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    role VARCHAR NOT NULL, -- SME, Developer, Analyst, Admin
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_coding_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES annotation_users(id),
    client_project_id UUID REFERENCES client_projects(id),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    traces_assigned INTEGER DEFAULT 0,
    traces_completed INTEGER DEFAULT 0
);

CREATE TABLE trace_assignments (
    id UUID PRIMARY KEY,
    trace_id UUID REFERENCES traces(id),
    assigned_user_id UUID REFERENCES annotation_users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    status VARCHAR DEFAULT 'assigned',
    annotation_data JSONB
);
```

---

## Phase 2: Open Coding & Analysis Platform
*Timeline: 4-5 weeks | Maps to "Open Coding & Analysis"*

### User Experience Overview - Phase 2

This phase introduces collaborative trace analysis where client SMEs and developers work together to label and analyze conversation traces. The UI becomes more sophisticated, supporting detailed analysis workflows.

#### Client-Facing UI Experience:

**🔍 Open Coding Workspace**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Open Coding Session: Customer Support Analysis                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Progress: 127/500 traces labeled                                    [25% ██░░░] │
│ Team: Sarah (SME), Mike (Dev), Alex (Analyst)                      👥 3 online │
│                                                                                 │
│ ┌─ Trace #127 ────────────────┐  ┌─ Analysis Panel ─────────────────────────┐ │
│ │ User: "My order is delayed"  │  │ Labels Applied:                          │ │
│ │                             │  │ ✓ Intent: Order_Status                   │ │
│ │ Bot: "I can help you track   │  │ ✓ Sentiment: Frustrated                 │ │
│ │ your order. What's your      │  │ ✓ Complexity: Simple                    │ │
│ │ order number?"               │  │ ✓ Resolution: Appropriate                │ │
│ │                             │  │                                          │ │
│ │ User: "It's #12345"         │  │ Failure Modes:                           │ │
│ │                             │  │ ○ None identified                         │ │
│ │ Bot: "Order #12345 shipped  │  │                                          │ │
│ │ yesterday and will arrive    │  │ Quality Score: 4.2/5                    │ │
│ │ tomorrow by 2pm."           │  │                                          │ │
│ │                             │  │ [Save Labels] [Flag for Review]         │ │
│ └─────────────────────────────┘  └─────────────────────────────────────────┘ │
│                                                                                 │
│ [Previous] [Next] [Skip] [Batch Actions] [Export Progress]                     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**📋 Grading Rubric Interface**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Grading Rubric Builder v1.2                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Rubric Name: Customer Support Evaluation                                       │
│                                                                                 │
│ ┌─ Criteria 1: Response Accuracy ────────────────────────────────────────────┐ │
│ │ Weight: 40%                                                                 │ │
│ │ ○ 5: Completely accurate and helpful                                       │ │
│ │ ○ 4: Mostly accurate with minor issues                                     │ │
│ │ ○ 3: Partially accurate but missing key info                              │ │
│ │ ○ 2: Inaccurate but shows understanding                                   │ │
│ │ ○ 1: Completely inaccurate or unhelpful                                   │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Criteria 2: Tone & Empathy ──────────────────────────────────────────────┐ │
│ │ Weight: 30%                                                                 │ │
│ │ [Configure Scale...] [Add Examples...] [Test with Sample]                  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [Add Criteria] [Test Rubric] [Save Version] [Share with Team]                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Enhanced Evaluation View Evolution:

**🔄 From Basic List to Detailed Analysis**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Trace Analysis Dashboard                                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Filter: [All] [Labeled] [Unlabeled] [Flagged] [High Priority]                  │
│ View: [○ List] [○ Grid] [○ Analytics]                    Sort: [Recent] [▼]     │
│                                                                                 │
│ ┌─ Trace #127 ──────── 4.2★ ── Labeled ── 3 annotations ────────────────────┐ │
│ │ "My order is delayed" → "Order #12345 shipped yesterday..."                │ │
│ │ Labels: Order_Status, Frustrated, Simple, Appropriate                      │ │
│ │ Team: Sarah✓ Mike✓ Alex⚠ (conflict on sentiment)                          │ │
│ │ [View Full] [Resolve Conflict] [Add to Golden Set]                        │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Trace #126 ──────── 2.1★ ── Flagged ── Failure Mode ─────────────────────┐ │
│ │ "Cancel my subscription" → "I don't have access to that..."               │ │
│ │ Flags: Hallucination, Tool_Access_Error, Unhelpful                        │ │
│ │ [View Full] [Analyze Failure] [Report Bug]                                │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Internal Team UI Experience:

**📊 Project Analytics Dashboard**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TechCorp Project Analytics - Phase 2                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Labeling Progress ────────┐ ┌─ Team Performance ──────┐ ┌─ Quality Metrics ─┐ │
│ │ Completed: 127/500 (25%)   │ │ Sarah: 45 traces/day    │ │ Inter-annotator:   │ │
│ │ Rate: 12 traces/hour       │ │ Mike: 32 traces/day     │ │ Agreement: 87%     │ │
│ │ ETA: 3.2 days             │ │ Alex: 28 traces/day     │ │ Conflict Rate: 8%  │ │
│ │                           │ │                         │ │ Quality Score: 4.1 │ │
│ │ [Chart: Daily Progress]    │ │ [View Individual Stats] │ │ [View Conflicts]   │ │
│ └───────────────────────────┘ └─────────────────────────┘ └───────────────────┘ │
│                                                                                 │
│ ┌─ Emerging Patterns ────────────────────────────────────────────────────────┐ │
│ │ Most Common Failure: Tool Access Errors (23%)                              │ │
│ │ Best Performance Area: Simple Q&A (avg 4.7/5)                             │ │
│ │ Training Needed: Complex Multi-step Requests                               │ │
│ │ [Generate Report] [Schedule Review] [Adjust Rubric]                        │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Epic 2.1: Open Coding Application

**Objective**: Build collaborative trace labeling and analysis interface

**CRITICAL DECISION REQUIRED**: Client must choose analysis focus:
- **Input Focus**: User understanding, personalization, belief alignment  
- **Output Focus**: Error analysis, failure modes, quality improvement
- **Decision Point**: After terminology training, based on client assessment framework

#### Enhanced ConversationDetail Component:
```typescript
interface EnhancedTrace {
  id: string;
  query: string;
  response: string;
  rag_context?: RAGDocument[];
  tool_calls?: ToolCall[];
  user_context?: UserContext;
  labels?: Label[];
  annotations?: Annotation[];
  failure_modes?: FailureMode[];
}
```

#### Key Features:
- **Collaborative Labeling**: Multi-user annotation with conflict resolution
- **RAG Document Viewer**: Expandable RAG context display
- **Tool Call Visualization**: Interactive tool call trace visualization
- **Grading Interface**: Structured grading with rubric support
- **Export/Import**: Labeled dataset management

#### New UI Components:
```
/src/components/
├── trace-analysis/
│   ├── TraceViewer.tsx          # Enhanced conversation detail
│   ├── LabelingInterface.tsx    # Collaborative labeling
│   ├── RAGContextViewer.tsx     # RAG document display
│   ├── ToolCallTrace.tsx        # Tool call visualization
│   └── GradingRubric.tsx        # Interactive rubric
```

### Epic 2.2: Grading Rubric & Training System

**Objective**: Create flexible rubric system and SME training workflows

#### Key Components:
- **Rubric Builder**: Drag-and-drop rubric creation interface
- **Version Control**: Git-like versioning for rubrics
- **Training Modules**: Interactive SME training workflows
- **Calibration Tests**: Inter-annotator agreement measurement
- **Quality Metrics**: Annotation quality and consistency tracking

#### Backend Support:
- **rubric-service**: Rubric management and versioning
- **training-service**: Training workflow orchestration
- **analytics-service**: Quality metrics and reporting

---

## Phase 3: Failure Mode Analysis & Taxonomy
*Timeline: 3-4 weeks | Maps to "Failure Mode Analysis"*

### User Experience Overview - Phase 3

This phase focuses on systematic failure analysis and taxonomy building. The UI shifts toward sophisticated analytical tools that help teams understand and categorize failure patterns systematically.

#### Client-Facing UI Experience:

**🔬 Failure Analysis Workbench**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Axial Coding Session: Failure Pattern Analysis                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Dataset: 89 failure traces identified                     AI Assist: [●] On     │
│ Clusters Found: 7 distinct patterns                       Confidence: 84%       │
│                                                                                 │
│ ┌─ Cluster 1: Tool Access Failures (23 traces) ─────────────────────────────┐ │
│ │ ┌─ Representative Example ──────────────────────────────────────────────┐ │ │
│ │ │ User: "Cancel my subscription"                                        │ │ │
│ │ │ Bot: "I don't have access to subscription management tools"          │ │ │
│ │ │ Expected: Should use cancel_subscription tool                        │ │ │
│ │ │ Root Cause: Tool integration failure                                 │ │ │
│ │ └───────────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                           │ │
│ │ Sub-patterns:                                                             │ │
│ │ ○ Authentication timeout (12 traces)                                     │ │
│ │ ○ Tool not configured (8 traces)                                        │ │
│ │ ○ Permission denied (3 traces)                                          │ │
│ │                                                                           │ │
│ │ [Refine Cluster] [Merge with Similar] [Create Taxonomy Entry]           │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [Previous Cluster] [Next Cluster] [Export Analysis] [Schedule Review]          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**🏗️ Taxonomy Builder Interface**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Failure Mode Taxonomy v1.0                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Technical Failures ────────────────────────────────────────────────────────┐ │
│ │ ├─ Tool Integration Issues                                              (23) │ │
│ │ │   ├─ Authentication Timeout                                           (12) │ │
│ │ │   ├─ Tool Not Configured                                              (8)  │ │
│ │ │   └─ Permission Denied                                                (3)  │ │
│ │ ├─ RAG Retrieval Failures                                              (18) │ │
│ │ │   ├─ Document Not Found                                               (11) │ │
│ │ │   └─ Irrelevant Context Retrieved                                     (7)  │ │
│ │ └─ API Timeout/Rate Limiting                                           (12) │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Content Quality Issues ────────────────────────────────────────────────────┐ │
│ │ ├─ Hallucination                                                        (15) │ │
│ │ ├─ Inconsistent Tone                                                    (9)  │ │
│ │ └─ Incomplete Information                                               (21) │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [Add Category] [Reorganize] [Export Taxonomy] [Lock Version]                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**💎 Golden Traces Management**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Golden Trace Set v2.1                                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Status: Under Review                                          Coverage: 94%      │
│ Reviewers: Sarah Chen ✓, Dr. Martinez ✓, Alex Wong ⏳                         │
│                                                                                 │
│ ┌─ Excellent Examples (Score 4.5+) ──────────────────────────────────────────┐ │
│ │ ✓ #127 - Perfect order tracking response                              5.0  │ │
│ │ ✓ #89  - Empathetic refund handling                                   4.8  │ │
│ │ ✓ #203 - Complex multi-step troubleshooting                           4.7  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Representative Failures (Score 1.0-2.5) ──────────────────────────────────┐ │
│ │ ✓ #45  - Tool access failure (authentication timeout)                 1.2  │ │
│ │ ✓ #156 - Hallucinated policy information                              1.8  │ │
│ │ ◯ #78  - Tone mismatch for frustrated customer       [Pending Review] 2.1  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [Approve Set] [Request Changes] [Compare with v2.0] [Export for Training]      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Internal Team UI Experience:

**📈 Failure Analytics Dashboard**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TechCorp Failure Analysis - Phase 3 Summary                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Failure Distribution ──────────┐ ┌─ Trend Analysis ─────────┐ ┌─ Priority ─┐ │
│ │ Tool Issues: 26% ████████░░     │ │ Week 1: 23% failure rate │ │ High: 12   │ │
│ │ Content Quality: 31% ██████████ │ │ Week 2: 19% failure rate │ │ Med: 18    │ │
│ │ RAG Problems: 20% ██████░░      │ │ Week 3: 15% failure rate │ │ Low: 15    │ │
│ │ Other: 23% ███████░░            │ │ Target: <10% failure rate│ │            │ │
│ └─────────────────────────────────┘ └──────────────────────────┘ └────────────┘ │
│                                                                                 │
│ ┌─ Taxonomy Completion Status ────────────────────────────────────────****────────┐ │
│ │ Categories Defined: 12/15 (80%)                                            │ │
│ │ Coverage: 94% of failure traces categorized                                │ │
│ │ Inter-rater Agreement: 91% (Excellent)                                     │ │
│ │ Golden Set Status: v2.1 pending final approval                             │ │
│ │                                                                             │ │
│ │ Next Steps:                                                                 │ │
│ │ • Complete remaining 3 categories                                          │ │
│ │ • Finalize golden set v2.1                                                 │ │
│ │ • Begin LLM judge training preparation                                     │ │
│ │                                                                             │ │
│ │ [View Detailed Report] [Schedule Phase 4 Kickoff] [Export Deliverables]   │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Epic 3.1: Axial Coding System

**Objective**: Implement AI-assisted failure pattern recognition and taxonomy building

**TOOL INTEGRATION REQUIREMENT**: Import/export compatibility with other AI eval tools
- **Client Expectation**: Interoperability with existing evaluation workflows
- **Target Formats**: CSV, JSON, standard eval formats
- **Integration Research**: Survey common client tool ecosystem (pending)

#### Key Components:
- **Pattern Recognition**: ML-based clustering of failure modes
- **Taxonomy Builder**: Interactive failure mode categorization
- **Axial Coding Interface**: Structured analysis of trace failures
- **Relationship Mapping**: Visual failure mode relationship diagrams
- **Import/Export System**: Multi-format data exchange capabilities

#### Technical Implementation:
```python
# New backend service: failure-analysis-service
class FailureModeAnalyzer:
    def cluster_failures(self, traces: List[Trace]) -> List[FailureCluster]
    def extract_patterns(self, cluster: FailureCluster) -> List[Pattern]
    def build_taxonomy(self, patterns: List[Pattern]) -> FailureTaxonomy
    def suggest_categories(self, failure: Failure) -> List[Category]
```

### Epic 3.2: Golden Traces & Quality Assurance

**Objective**: Establish versioned golden trace sets with change tracking

#### Key Components:
- **Golden Trace Selection**: Criteria-based trace selection
- **Version Management**: Immutable golden trace versions
- **Change Tracking**: Detailed change logs and impact analysis
- **Validation Workflows**: Multi-reviewer approval processes
- **Drift Detection**: Automated detection of evaluation drift

---

## Phase 4: Evaluation System Implementation
*Timeline: 5-6 weeks | Maps to "Evaluation System Implementation"*

### User Experience Overview - Phase 4

This phase introduces automated LLM judges and sophisticated evaluation capabilities. The UI becomes more technical but maintains accessibility for client teams to understand and calibrate the evaluation system.

#### Client-Facing UI Experience:

**🤖 LLM Judge Training Dashboard**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Judge Training Pipeline: Customer Support Evaluator v1.3                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Training Status: [████████████████████████████░░] 87% Complete                  │
│ ETA: 2.3 hours                                           Model: GPT-4-Turbo     │
│                                                                                 │
│ ┌─ Training Data Summary ─────────────────────────────────────────────────────┐ │
│ │ Excellent Examples: 47 traces (score 4.5+)                                 │ │
│ │ Good Examples: 128 traces (score 3.5-4.4)                                  │ │
│ │ Poor Examples: 89 traces (score 1.0-2.5)                                   │ │
│ │ Edge Cases: 23 traces (unusual scenarios)                                  │ │
│ │                                                                             │ │
│ │ Inter-annotator Agreement: 91% (High Confidence)                           │ │
│ │ Rubric Alignment: 94% consistency with human evaluators                    │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Judge Performance Preview ─────────────────────────────────────────────────┐ │
│ │ Test Sample Results (n=25):                                                │ │
│ │ • Accuracy vs Human: 89% ±3%                                               │ │
│ │ • False Positive Rate: 7%                                                  │ │
│ │ • False Negative Rate: 4%                                                  │ │
│ │ • Bias Detection: No significant bias detected                             │ │
│ │                                                                             │ │
│ │ [View Sample Evaluations] [Adjust Parameters] [Run Full Test]             │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [Pause Training] [Review Progress] [Schedule Calibration Workshop]             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**🎯 Judge Calibration Workshop Interface**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Multi-Expert Calibration Session                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Participants: Sarah (SME) ●, Dr. Martinez (SME) ●, Alex (Analyst) ●           │
│ Round: 3 of 5                                              Agreement: 84%      │
│                                                                                 │
│ ┌─ Trace Under Review ────────────────────────────────────────────────────────┐ │
│ │ User: "I've been waiting 3 hours for support, this is ridiculous!"         │ │
│ │ Bot: "I understand your frustration. Let me prioritize your case and       │ │
│ │      connect you with our escalation team immediately."                    │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Individual Scores ─────────────────────────────────────────────────────────┐ │
│ │ Sarah:    Accuracy: 5/5, Tone: 5/5, Speed: 4/5        Overall: 4.7/5      │ │
│ │ Martinez: Accuracy: 5/5, Tone: 4/5, Speed: 5/5        Overall: 4.7/5      │ │
│ │ Alex:     Accuracy: 4/5, Tone: 5/5, Speed: 4/5        Overall: 4.3/5      │ │
│ │ LLM Judge: Accuracy: 5/5, Tone: 4/5, Speed: 4/5       Overall: 4.3/5      │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Discussion Panel ──────────────────────────────────────────────────────────┐ │
│ │ Sarah: "The empathy here is excellent, but could be faster"                │ │
│ │ Martinez: "Agreed on empathy. Speed seems appropriate for escalation"       │ │
│ │ Alex: "Judge is slightly underrating the tone - very empathetic response"  │ │
│ │ [Add Comment] [Vote on Consensus] [Flag for Additional Review]             │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [Next Trace] [Save Consensus] [Adjust Judge Parameters] [End Session]          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**⚖️ A/B Testing Framework**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Judge Comparison: GPT-4 vs Claude-3 vs Custom Fine-tuned                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Test Duration: 7 days                    Test Set: 150 traces                  │
│ Confidence Level: 95%                    Statistical Significance: ✓           │
│                                                                                 │
│ ┌─ Performance Metrics ───────────────────────────────────────────────────────┐ │
│ │                   │ Accuracy │ Consistency │ Speed │ Cost/Eval │ Overall    │ │
│ │ GPT-4-Turbo      │   89%    │    94%      │ 2.3s  │  $0.023   │ 🥈 Second  │ │
│ │ Claude-3-Sonnet  │   92%    │    91%      │ 1.8s  │  $0.018   │ 🥇 Winner  │ │
│ │ Custom Fine-tune │   87%    │    96%      │ 3.1s  │  $0.012   │ 🥉 Third   │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Detailed Analysis ─────────────────────────────────────────────────────────┐ │
│ │ • Claude-3-Sonnet shows best balance of accuracy and cost                  │ │
│ │ • GPT-4 excellent at edge cases but higher cost                           │ │
│ │ • Custom model most consistent but slower training cycles                 │ │
│ │                                                                             │ │
│ │ Recommendation: Deploy Claude-3-Sonnet for production                      │ │
│ │ Backup: GPT-4-Turbo for complex/edge cases                               │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [Deploy Winning Model] [Extend Test] [View Detailed Report] [Export Results]   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Evolution of Existing Views:

**📊 Enhanced Evaluation Dashboard**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Automated Evaluation Dashboard                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Active Judges: 3 ●●●                               Evaluation Queue: 247 traces │
│ Daily Throughput: 1,847 evaluations               Avg Response Time: 1.9s      │
│                                                                                 │
│ ┌─ Real-time Evaluation Stream ───────────────────────────────────────────────┐ │
│ │ 14:32:18 | Trace #1547 | 4.2★ | Claude-3 | 1.8s | ✓ Confidence: 94%       │ │
│ │ 14:32:15 | Trace #1546 | 2.1★ | GPT-4    | 2.3s | ⚠ Flagged: Edge Case    │ │
│ │ 14:32:12 | Trace #1545 | 4.8★ | Claude-3 | 1.6s | ✓ Confidence: 98%       │ │
│ │ 14:32:09 | Trace #1544 | 1.3★ | GPT-4    | 2.1s | ✓ Failure Mode: Tool    │ │
│ │ [View All] [Filter by Score] [Export Batch]                               │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Quality Monitoring ────────────────────────────────────────────────────────┐ │
│ │ Human-AI Agreement: 91% ▲2%            Drift Detection: ✓ Stable            │ │
│ │ False Positive Rate: 6% ▼1%           Bias Monitoring: ✓ No Issues         │ │
│ │ Processing Reliability: 99.7%         Cost Efficiency: $0.019/eval         │ │
│ │                                                                             │ │
│ │ [Generate Quality Report] [Adjust Thresholds] [Schedule Recalibration]     │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Internal Team UI Experience:

**🔧 Judge Management Console**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ LLM Judge Fleet Management                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Active Judges ─────────────────────────────────────────────────────────────┐ │
│ │ TechCorp-Support-v1.3    [●] Online   │ 1,247 evals │ 91% accuracy │ $127  │ │
│ │ HealthBot-Clinical-v2.1  [●] Online   │   892 evals │ 94% accuracy │  $89  │ │
│ │ RetailBot-General-v1.8   [⏸] Paused   │    45 evals │ 87% accuracy │  $12  │ │
│ │                                                                             │ │
│ │ [Deploy New] [Scale Up] [Performance Report] [Cost Analysis]               │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Training Pipeline Status ──────────────────────────────────────────────────┐ │
│ │ FinanceBot-v1.0: Training 73% ████████████████░░░░ ETA: 4.2h              │ │
│ │ LegalBot-v2.3:   Calibration Phase ⚙️ Scheduled: Tomorrow 2pm             │ │
│ │ TechCorpv1.4:    A/B Testing 🔄 vs Claude-3.5 (Day 3/7)                  │ │
│ │                                                                             │ │
│ │ [View All Pipelines] [Resource Allocation] [Queue Management]              │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ System Health ─────────────────────────────────────────────────────────────┐ │
│ │ API Uptime: 99.97%              Rate Limits: 23% utilized                  │ │
│ │ Queue Depth: 12 pending          Processing Latency: 1.9s avg             │ │
│ │ Error Rate: 0.03%               Cost Burn: $234/day (within budget)       │ │
│ │                                                                             │ │
│ │ [View Metrics] [Alert Settings] [Performance Optimization]                │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Epic 4.1: LLM Judge Training Platform

**Objective**: Build comprehensive LLM judge training and calibration system

#### Core Architecture:
```typescript
interface LLMJudge {
  id: string;
  name: string;
  model_config: ModelConfig;
  training_data: TrainingDataset;
  calibration_score: number;
  failure_modes: FailureMode[];
  performance_metrics: JudgeMetrics;
}

interface JudgeTrainingPipeline {
  data_preparation: DataPreparationStep;
  model_training: ModelTrainingStep;
  calibration: CalibrationStep;
  validation: ValidationStep;
  deployment: DeploymentStep;
}
```

#### Key Features:
- **Training Data Management**: Use open coding data for judge training
- **Model Configuration**: Support for different LLM backends (GPT, Claude, local models)
- **Calibration Workshops**: Multi-expert recalibration interfaces
- **A/B Testing**: Compare different judge configurations
- **Performance Monitoring**: Real-time judge performance tracking

#### Deterministic Checks Integration:
```python
class DeterministicValidator:
    def validate_syntax(self, response: str) -> ValidationResult
    def validate_tool_calls(self, tool_calls: List[ToolCall]) -> ValidationResult
    def validate_structure(self, response: str, schema: Schema) -> ValidationResult
    def validate_constraints(self, response: str, constraints: List[Constraint]) -> ValidationResult
```

### Epic 4.2: Epistemic Me Integration Layer

**Objective**: Integrate self-models and belief systems into evaluation pipeline

#### Self-Model Context Injection:
```typescript
interface EpistemicEvaluationContext {
  user_self_model: SelfModel;
  belief_system: BeliefSystem;
  philosophy_framework: Philosophy[];
  causal_relationships: CausalMap;
  epistemic_context: EpistemicContext;
}

interface PersonalizedJudgment {
  base_score: number;
  personalization_adjustment: number;
  final_score: number;
  reasoning: string;
  belief_alignment: BeliefAlignment;
  philosophy_consistency: PhilosophyConsistency;
}
```

#### Key Components:
- **Context Enrichment Service**: Inject user context into evaluation
- **Belief Alignment Analysis**: Measure response alignment with user beliefs
- **Philosophy Consistency Check**: Validate responses against user philosophies
- **Personalization Metrics**: Track effectiveness of personalized evaluation

---

## Phase 5: Personalization Implementation
*Timeline: 6-7 weeks | Maps to "Personalization Implementation"*

### User Experience Overview - Phase 5

This phase introduces the core Epistemic Me capabilities - personalization through self-models and belief systems. The UI becomes sophisticated while remaining intuitive, showing how user context progressively enhances evaluation quality.

#### Client-Facing UI Experience:

**🧠 Self-Model Integration Dashboard**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Progressive Input Complexity: Level 3 → Level 4 Migration                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Current Status: Integrating Epistemic Context                  Progress: 68%    │
│ User Models: 1,247 profiles enriched                          Quality: +23%     │
│                                                                                 │
│ ┌─ Input Complexity Evolution ────────────────────────────────────────────────┐ │
│ │ Level 1: Basic Traces           [████████████████████] 100% Complete       │ │
│ │ Level 2: + Cohort & Intent      [████████████████████] 100% Complete       │ │
│ │ Level 3: + Self-Model & Beliefs [██████████████████░░]  89% Complete       │ │
│ │ Level 4: + Epistemic Context    [█████████████░░░░░░░]  68% In Progress     │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Personalization Impact Metrics ────────────────────────────────────────────┐ │
│ │ Evaluation Accuracy:     +23% vs baseline (87% → 96%)                      │ │
│ │ Recommendation Relevance: +31% user satisfaction                           │ │
│ │ False Positive Reduction: -45% (context-aware filtering)                   │ │
│ │ User Engagement:         +18% session duration                             │ │
│ │                                                                             │ │
│ │ [View Detailed Impact] [Compare A/B Results] [Generate Report]             │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [Continue Migration] [Review Sample Cases] [Adjust Parameters]                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**👤 User Context Viewer**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ User Profile: Sarah Chen (Customer ID: 12847)                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Basic Context (Level 2) ───────────────────────────────────────────────────┐ │
│ │ Cohort: Premium_Customer_Tech_Savvy                                         │ │
│ │ Primary Intent: Technical_Support, Account_Management                       │ │
│ │ Session Context: Mobile_App, Evening_Hours, Frustrated_Tone                │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Self-Model & Beliefs (Level 3) ────────────────────────────────────────────┐ │
│ │ Core Beliefs:                                                               │ │
│ │ • "Technology should work seamlessly without complexity"                   │ │
│ │ • "Customer service should be proactive, not reactive"                     │ │
│ │ • "Time is valuable - efficiency over explanation"                         │ │
│ │                                                                             │ │
│ │ Communication Style: Direct, Solution-Focused, Technical Detail Preferred  │ │
│ │ Trust Level: High (4.2/5) | Patience Level: Low (2.1/5)                  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Epistemic Context (Level 4) ───────────────────────────────────────────────┐ │
│ │ Causal Relationships:                                                       │ │
│ │ • Fast Resolution → Increased Trust → Higher Lifetime Value                │ │
│ │ • Technical Jargon → Increased Confidence → Better Engagement              │ │
│ │ • Proactive Communication → Reduced Frustration → Positive Reviews         │ │
│ │                                                                             │ │
│ │ Philosophy Framework: Pragmatic, Evidence-Based, Efficiency-Oriented       │ │
│ │ [View Full Epistemic Map] [Edit Relationships] [Update Beliefs]           │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [View Historical Interactions] [Generate Recommendations] [Export Profile]      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**🎯 Recommendation Engine Interface**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Personalized Recommendation Engine v2.1                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ User: Sarah Chen | Context: Technical Issue with Mobile App                     │
│ Confidence: 94% | Belief Alignment: 97% | Philosophy Match: 91%               │
│                                                                                 │
│ ┌─ Generated Response Analysis ───────────────────────────────────────────────┐ │
│ │ Original Response:                                                          │ │
│ │ "I understand you're having trouble. Let me walk you through some          │ │
│ │ troubleshooting steps to help resolve this issue..."                       │ │
│ │                                                                             │ │
│ │ Personalized Enhancement:                                                   │ │
│ │ "I can see this is a known issue affecting v3.2.1. I'll escalate this     │ │
│ │ directly to our technical team and push a priority patch. Meanwhile,       │ │
│ │ here's a 30-second workaround that maintains full functionality..."        │ │
│ │                                                                             │ │
│ │ Personalization Factors Applied:                                           │ │
│ │ ✓ Technical language (matches communication style)                         │ │
│ │ ✓ Proactive escalation (aligns with "proactive service" belief)           │ │
│ │ ✓ Time-efficient solution (respects "efficiency over explanation")         │ │
│ │ ✓ Specific version info (satisfies technical detail preference)            │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Causal Impact Prediction ──────────────────────────────────────────────────┐ │
│ │ Predicted Outcomes:                                                         │ │
│ │ • Trust Level: 4.2 → 4.6 (+9%)                                            │ │
│ │ • Satisfaction Score: 4.1 → 4.8 (+17%)                                    │ │
│ │ • Future Issue Escalation: -23% reduction                                  │ │
│ │ • Review Likelihood: +34% positive review probability                      │ │
│ │                                                                             │ │
│ │ [Apply Recommendations] [A/B Test] [Simulate Alternative] [Save Template]  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**🧪 Conversation Simulation Lab**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Synthetic User Conversation Testing                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Simulation Batch: 150 conversations                           Status: Running   │
│ User Personas: 12 distinct profiles                          Completion: 73%    │
│                                                                                 │
│ ┌─ Real-time Simulation Stream ───────────────────────────────────────────────┐ │
│ │ Persona: "Frustrated_Senior_Customer" | Conversation #147                  │ │
│ │ ├─ User: "This app is too confusing, I just want to pay my bill"          │ │
│ │ ├─ Bot: "I'll guide you to the simplified payment interface and save      │ │
│ │ │        this preference for future visits..."                            │ │
│ │ ├─ Evaluation: 4.3/5 (Personalization: +0.8 vs baseline)                 │ │
│ │ └─ Belief Alignment: 89% (matches "simplicity preference")                │ │
│ │                                                                             │ │
│ │ Persona: "Tech_Enthusiast_Power_User" | Conversation #148                  │ │
│ │ ├─ User: "Can I access the API logs for my integration testing?"          │ │
│ │ ├─ Bot: "Absolutely. Here's your developer dashboard with real-time       │ │
│ │ │        API logs, rate limit status, and webhook testing tools..."       │ │
│ │ ├─ Evaluation: 4.7/5 (Personalization: +1.2 vs baseline)                 │ │
│ │ └─ Belief Alignment: 96% (matches "technical autonomy" philosophy)         │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [Pause Simulation] [View Results] [Export Test Cases] [Adjust Personas]        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Enhanced Chat Experience:

**💬 Personalization-Aware Chat Interface**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Epistemic Me Chat - Sarah Chen (Premium Tech User)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Active Personalization: [●] ON          Belief Alignment: 94%                   │
│ Context Level: 4 (Full Epistemic)       Philosophy Match: 91%                   │
│                                                                                 │
│ ┌─ Conversation Thread ───────────────────────────────────────────────────────┐ │
│ │ User: My mobile app keeps crashing when I try to upload documents          │ │
│ │                                                                             │ │
│ │ Assistant: I can see this is affecting build v3.2.1 specifically.         │ │
│ │ I've already escalated this to our mobile team as P1 - they're pushing    │ │
│ │ a hotfix within 2 hours. For immediate access, the web portal has the     │ │
│ │ same upload functionality with better error handling.                      │ │
│ │                                                                             │ │
│ │ ┌─ Personalization Indicators ─────────────────────────────────────────┐   │ │
│ │ │ ✓ Technical specificity (v3.2.1)                                     │   │ │
│ │ │ ✓ Proactive escalation (P1 priority)                                 │   │ │
│ │ │ ✓ Time-specific solution (2 hours)                                   │   │ │
│ │ │ ✓ Alternative provided (efficiency focus)                            │   │ │
│ │ └───────────────────────────────────────────────────────────────────────┘   │ │
│ │                                                                             │ │
│ │ User: Perfect, that's exactly what I needed. Can you send me the link?     │ │
│ │                                                                             │ │
│ │ Assistant: https://portal.company.com/documents/upload                     │ │
│ │ I've also set a reminder to follow up with you once the mobile fix is     │ │
│ │ deployed. Your preference for proactive updates is noted in your profile. │ │
│ │                                                                             │ │
│ │ ⭐ User Rating: 5/5 | Predicted vs Actual: 4.8 vs 5.0 (+4% accuracy)      │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [Toggle Personalization] [View User Profile] [Personalization Insights]        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Internal Team UI Experience:

**📊 Personalization Analytics Command Center**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Epistemic Me Personalization Analytics - All Clients                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ System-wide Impact ────────────────────────────────────────────────────────┐ │
│ │ Personalization Adoption: 89% of client projects                           │ │
│ │ Avg Quality Improvement: +27% evaluation accuracy                          │ │
│ │ User Satisfaction Delta: +34% vs non-personalized                         │ │
│ │ Cost Efficiency: 15% reduction in support escalations                     │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Client Performance Breakdown ──────────────────────────────────────────────┐ │
│ │ TechCorp:    Level 4 | +31% quality | 94% belief alignment | $2.1k saved  │ │
│ │ HealthBot:   Level 3 | +28% quality | 91% belief alignment | $1.8k saved  │ │
│ │ RetailCorp:  Level 4 | +35% quality | 96% belief alignment | $3.2k saved  │ │
│ │ FinanceBot:  Level 2 | +18% quality | 87% belief alignment | $0.9k saved  │ │
│ │                                                                             │ │
│ │ [Detailed Breakdown] [ROI Analysis] [Upgrade Recommendations]              │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Epistemic Context Health ──────────────────────────────────────────────────┐ │
│ │ Belief System Accuracy: 93% verified against user behavior                │ │
│ │ Philosophy Consistency: 91% maintained across interactions                │ │
│ │ Causal Model Validation: 87% prediction accuracy                          │ │
│ │ Context Drift Detection: 2 alerts (minor belief updates needed)           │ │
│ │                                                                             │ │
│ │ [Update Belief Models] [Recalibrate Philosophies] [Review Drift Alerts]   │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Epic 5.1: Self-Model Enhanced Input System

**Objective**: Implement progressive input complexity with self-model integration

#### Input Complexity Levels:
```typescript
// Level 1: Basic Trace
interface BasicTrace {
  query: string;
  response: string;
  timestamp: string;
}

// Level 2: Contextual Trace
interface ContextualTrace extends BasicTrace {
  user_cohort: UserCohort;
  intent: Intent;
  session_context?: SessionContext;
}

// Level 3: Self-Model Trace
interface SelfModelTrace extends ContextualTrace {
  user_self_model: SelfModel;
  active_beliefs: Belief[];
  philosophy_context: Philosophy[];
}

// Level 4: Full Epistemic Trace
interface EpistemicTrace extends SelfModelTrace {
  full_user_context: UserContext;
  epistemic_context: EpistemicContext;
  causal_relationships: CausalMap;
  recommendation_context: RecommendationContext;
}
```

#### Progressive Enhancement Strategy:
1. **Week 1-2**: Implement basic trace collection and storage
2. **Week 3**: Add cohort and intent classification
3. **Week 4-5**: Integrate self-model and belief system data
4. **Week 6-7**: Full epistemic context integration and testing

### Epic 5.2: Recommendation System

**Objective**: Build cause/effect-aligned recommendation engine with specialized judges

#### Core Architecture:
```typescript
interface RecommendationEngine {
  ontology: CauseEffectOntology;
  specialized_judges: SpecializedJudge[];
  simulation_engine: ConversationSimulator;
  personalization_pipeline: PersonalizationPipeline;
}

interface CauseEffectOntology {
  relationships: CausalRelationship[];
  intervention_points: InterventionPoint[];
  outcome_predictions: OutcomePrediction[];
  feedback_loops: FeedbackLoop[];
}
```

#### Key Components:
- **Ontology Builder**: Interactive cause/effect relationship mapping
- **Specialized Judge Training**: Recommendation-specific LLM judges
- **Simulation Engine**: Run conversations with updated ontologies
- **Personalization Dashboard**: Real-time metrics and insights
- **A/B Testing Framework**: Test different recommendation strategies

---

## Phase 6: Advanced Analytics & Monitoring
*Timeline: 3-4 weeks | Maps to "Post-Implementation Phase"*

### User Experience Overview - Phase 6

This final phase focuses on demonstrating value, ensuring self-sufficiency, and providing comprehensive analytics. The UI emphasizes executive-level insights and long-term monitoring capabilities.

#### Client-Facing UI Experience:

**📊 Executive ROI Dashboard**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TechCorp LLM Evaluation Project - Final Results Summary                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Project Duration: 30 weeks                    Total Investment: $127,000        │
│ Implementation Complete: 100%                 ROI Achieved: 347%                │
│                                                                                 │
│ ┌─ Before vs After Comparison ────────────────────────────────────────────────┐ │
│ │                    │ Baseline │ Current │ Improvement │ Business Impact     │ │
│ │ Response Quality   │   73%    │   96%   │    +31%     │ +$2.1M revenue     │ │
│ │ Customer Satisfaction│ 3.2/5   │  4.7/5  │   +47%     │ +23% retention     │ │
│ │ Resolution Time    │  4.2h    │  1.8h   │   -57%     │ -$890k costs       │ │
│ │ Escalation Rate    │   18%    │   7%    │   -61%     │ -$340k support     │ │
│ │ Agent Productivity │ 12 tickets/day│ 23 tickets/day│ +92%│ +$1.5M capacity│ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Financial Impact ──────────────────────────────────────────────────────────┐ │
│ │ Annual Cost Savings:     $2,847,000                                        │ │
│ │ Revenue Enhancement:     $3,245,000                                        │ │
│ │ Total Value Created:     $6,092,000                                        │ │
│ │ Payback Period:          4.2 months                                        │ │
│ │                                                                             │ │
│ │ [Download Executive Report] [Schedule Board Presentation] [Plan Phase 2]   │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**🎯 Self-Sufficiency Assessment**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Team Readiness & Knowledge Transfer Assessment                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Overall Readiness Score: 89%                            Certification: Ready    │
│                                                                                 │
│ ┌─ Team Capability Assessment ────────────────────────────────────────────────┐ │
│ │ ✅ Technical Team (Sarah, Mike, Alex)                              Score: 94% │ │
│ │   • Open Coding: Expert level                                               │ │
│ │   • Rubric Management: Advanced                                             │ │
│ │   • LLM Judge Training: Intermediate                                        │ │
│ │   • Analytics Interpretation: Advanced                                     │ │
│ │                                                                             │ │
│ │ ✅ SME Team (Dr. Martinez, Domain Experts)                         Score: 91% │ │
│ │   • Evaluation Framework: Expert level                                     │ │
│ │   • Quality Assessment: Expert level                                       │ │
│ │   • Personalization Concepts: Advanced                                     │ │
│ │                                                                             │ │
│ │ ⚠️  Management Team                                                Score: 76% │ │
│ │   • Platform Understanding: Good                                           │ │
│ │   • ROI Interpretation: Advanced                                           │ │
│ │   • Strategic Planning: Needs Review                                       │ │
│ │                                                                             │ │
│ │ [Schedule Additional Training] [Certification Test] [Handover Plan]        │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**🔄 Continuous Monitoring Setup**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Continuous Monitoring & Alerting Configuration                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Status: Active                                    Next Review: 30 days          │
│                                                                                 │
│ ┌─ Performance Monitoring ─────────────────────────────────────────────────────┐ │
│ │ ✅ Quality Score Tracking        Alert Threshold: <90%      Current: 96%    │ │
│ │ ✅ Judge Performance Monitoring  Alert Threshold: <85%      Current: 91%    │ │
│ │ ✅ Personalization Effectiveness Alert Threshold: <80%      Current: 94%    │ │
│ │ ✅ Cost Efficiency Tracking     Alert Threshold: >$0.025   Current: $0.019 │ │
│ │ ✅ User Satisfaction Monitoring  Alert Threshold: <4.0/5    Current: 4.7/5  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Drift Detection ───────────────────────────────────────────────────────────┐ │
│ │ Model Performance Drift:         ✓ Stable (0.02% weekly variance)          │ │
│ │ User Behavior Drift:            ✓ Stable (seasonal patterns detected)      │ │
│ │ Belief System Evolution:         ⚠️ Minor drift (2 users need updates)      │ │
│ │ Technology Stack Changes:        ✓ No breaking changes detected             │ │
│ │                                                                             │ │
│ │ [Configure Alerts] [Update Thresholds] [Review Drift Reports]              │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**📈 Long-term Analytics Dashboard**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Long-term Performance Analytics & Trend Analysis                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Time Range: Last 12 months                               Auto-refresh: ON      │
│                                                                                 │
│ ┌─ Performance Trends ─────────────────────────────────────────────────────────┐ │
│ │     Quality Score ┌─────────────────────────────────────────────────────┐   │ │
│ │     100% ┤        │ ████████████████████████████████████████████████   │   │ │
│ │      90% ┤        │ ██████████████████████████████████████             │   │ │
│ │      80% ┤        │ ████████████████████████                           │   │ │
│ │      70% ┤ ████   │ ██████████████                                     │   │ │
│ │          └────────┼────────────────────────────────────────────────────┘   │ │
│ │          Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec                  │ │
│ │                                                                             │ │
│ │ Key Insights:                                                               │ │
│ │ • Steady improvement from 73% → 96% over 8 months                         │ │
│ │ • Quality plateau reached in Month 10 (target achieved)                   │ │
│ │ • Seasonal variations: +3% during Q4 (holiday season)                     │ │
│ │ • No degradation despite 40% increase in volume                           │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [Download Trend Report] [Forecast Next Quarter] [Compare with Industry]        │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Enhanced Workbench Experience:

**🏆 Project Retrospective Interface**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Project Retrospective: TechCorp LLM Evaluation Platform                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ What Went Well ────────────────────────────────────────────────────────────┐ │
│ │ ✅ Open coding process exceeded quality targets (91% vs 85% target)         │ │
│ │ ✅ Team adoption was faster than expected (3 weeks vs 6 weeks planned)     │ │
│ │ ✅ Personalization features delivered exceptional ROI (347% vs 250% target)│ │
│ │ ✅ Cross-functional collaboration was highly effective                     │ │
│ │ ✅ Technical implementation was stable with 99.7% uptime                   │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Areas for Improvement ─────────────────────────────────────────────────────┐ │
│ │ ⚠️  Initial trace collection took longer than planned (+2 weeks)           │ │
│ │ ⚠️  Judge calibration required more expert time than budgeted              │ │
│ │ ⚠️  Change management could have been more structured                       │ │
│ │ ⚠️  Documentation updates lagged behind implementation                      │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Lessons Learned ───────────────────────────────────────────────────────────┐ │
│ │ 💡 Early SME engagement is critical for taxonomy quality                   │ │
│ │ 💡 Incremental complexity approach worked extremely well                   │ │
│ │ 💡 A/B testing framework provided invaluable insights                      │ │
│ │ 💡 Belief system modeling exceeded expectations for personalization        │ │
│ │ 💡 Regular stakeholder demos maintained momentum and buy-in                │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ [Generate Final Report] [Create Template] [Share Best Practices] [Plan Next]   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Internal Team UI Experience:

**🌟 Client Success Portfolio**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Epistemic Me Client Success Portfolio - All Projects                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Active Projects: 12 | Completed: 8 | Total Value Delivered: $47.2M             │
│                                                                                 │
│ ┌─ Completed Project Summary ──────────────────────────────────────────────────┐ │
│ │ TechCorp Support    │ 347% ROI │ ⭐⭐⭐⭐⭐ │ Testimonial ✓ │ Retainer: Yes │ │
│ │ HealthBot Clinical  │ 289% ROI │ ⭐⭐⭐⭐⭐ │ Testimonial ✓ │ Retainer: Yes │ │
│ │ RetailCorp Service  │ 412% ROI │ ⭐⭐⭐⭐⭐ │ Testimonial ✓ │ Retainer: Yes │ │
│ │ FinanceBot Risk     │ 234% ROI │ ⭐⭐⭐⭐   │ Testimonial ✓ │ Retainer: No  │ │
│ │ LegalBot Contracts  │ 298% ROI │ ⭐⭐⭐⭐⭐ │ Pending      │ Retainer: Yes │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Key Success Metrics ───────────────────────────────────────────────────────┐ │
│ │ Average ROI:              316% (Target: 250%)                               │ │
│ │ Client Satisfaction:      4.8/5 (Target: 4.0/5)                           │ │
│ │ Project Success Rate:     100% (8/8 completed successfully)                │ │
│ │ Retainer Conversion:      87% (7/8 clients signed ongoing contracts)       │ │
│ │ Reference Willingness:    100% (all clients provided testimonials)         │ │
│ │                                                                             │ │
│ │ [Generate Portfolio Report] [Update Marketing Materials] [Plan Expansion]  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Business Development Pipeline ──────────────────────────────────────────────┐ │
│ │ Warm Leads from Referrals:    14 opportunities ($12.3M potential)          │ │
│ │ Industry Recognition:         3 awards, 2 conference invitations           │ │
│ │ Thought Leadership:          12 published articles, 8 speaking events      │ │
│ │ Platform Maturity:           Enterprise-ready, 99.9% SLA capability        │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**🔧 Knowledge Management System**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Epistemic Me Knowledge Base & Best Practices Library                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Documented Best Practices ──────────────────────────────────────────────────┐ │
│ │ ✅ Client Onboarding Playbook (v3.2) - 47 pages, 8 templates              │ │
│ │ ✅ Open Coding Excellence Guide (v2.1) - Inter-annotator agreement >90%    │ │
│ │ ✅ LLM Judge Training Methodology (v1.8) - 94% human-AI agreement          │ │
│ │ ✅ Personalization Implementation Guide (v1.4) - +27% avg quality gains    │ │
│ │ ✅ Failure Mode Taxonomy Framework (v2.3) - 15 domain taxonomies           │ │
│ │ ✅ ROI Measurement & Reporting Standards (v1.6) - Executive-ready          │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Reusable Assets ───────────────────────────────────────────────────────────┐ │
│ │ Project Templates:        12 industry-specific starting points             │ │
│ │ Evaluation Frameworks:    8 domain-adapted rubric templates                │ │
│ │ Training Materials:       47 modules for client team education             │ │
│ │ Integration Patterns:     23 common system integration approaches          │ │
│ │ Presentation Decks:       15 stakeholder communication templates           │ │
│ │                                                                             │ │
│ │ [Access Knowledge Base] [Contribute Best Practice] [Request Training]      │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│ ┌─ Continuous Improvement ─────────────────────────────────────────────────────┐ │
│ │ Monthly Retrospectives:    Completed for all 8 projects                    │ │
│ │ Process Refinements:       23 improvements implemented                     │ │
│ │ Tool Enhancements:         12 platform upgrades based on client feedback  │ │
│ │ Team Training Updates:     Quarterly skill development programs            │ │
│ │                                                                             │ │
│ │ [Schedule Retrospective] [Submit Improvement] [Review Feedback]            │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Epic 6.1: Performance Analytics & ROI Assessment

**Objective**: Comprehensive performance measurement and business impact analysis

#### Analytics Dashboard:
```typescript
interface PerformanceMetrics {
  baseline_metrics: BaselineMetrics;
  current_metrics: CurrentMetrics;
  improvement_deltas: ImprovementDelta[];
  roi_analysis: ROIAnalysis;
  client_satisfaction: ClientSatisfactionMetrics;
}

interface ROIAnalysis {
  time_savings: TimeSavings;
  quality_improvements: QualityImprovements;
  cost_reductions: CostReductions;
  revenue_impact: RevenueImpact;
}
```

#### Key Features:
- **Before/After Comparisons**: Detailed baseline vs improved system metrics
- **ROI Calculator**: Business impact measurement tools
- **Client Success Tracking**: Self-sufficiency and outcome metrics
- **Trend Analysis**: Long-term performance trend visualization
- **Export/Reporting**: Executive summary and detailed reports

### Epic 6.2: Knowledge Management & Continuous Improvement

**Objective**: Build institutional knowledge and continuous improvement capabilities

#### Components:
- **Retrospective Tools**: Built-in project retrospective facilitation
- **Best Practices Library**: Accumulated knowledge from client projects
- **Template System**: Reusable project templates and frameworks
- **Integration Documentation**: Clean interface specifications
- **Continuous Monitoring**: Real-time system health and performance

---

## Technical Architecture Evolution

### Enhanced Web-UI Structure
```
/src/app/
├── client-portal/              # Client onboarding & management
│   ├── onboarding/
│   ├── project-dashboard/
│   └── team-management/
├── trace-management/           # Enhanced trace collection & analysis
│   ├── collection/
│   ├── import-export/
│   └── validation/
├── open-coding/               # Collaborative labeling interface
│   ├── labeling/
│   ├── rubric-builder/
│   └── training/
├── evaluation-dashboard/       # LLM judge management & calibration
│   ├── judge-training/
│   ├── calibration/
│   └── performance/
├── personalization/           # Self-model integration & testing
│   ├── context-management/
│   ├── recommendation-engine/
│   └── simulation/
└── analytics/                # Performance monitoring & insights
    ├── performance-dashboard/
    ├── roi-analysis/
    └── reporting/
```

### Backend Service Extensions

#### New Services:
- **client-management-service** (Port 8130): Client project management
- **evaluation-service** (Port 8140): LLM judge management and training
- **trace-analytics-service** (Port 8150): Advanced pattern recognition
- **recommendation-engine** (Port 8160): Cause/effect relationship processing
- **failure-analysis-service** (Port 8170): Failure mode analysis and taxonomy

#### Enhanced Existing Services:
- **profile-mcp**: Enhanced with client project support and self-model context injection
- **em-mcp**: Expanded belief system integration and philosophy processing
- **profile-mcp-eval**: Enhanced with specialized judge evaluation capabilities

### Database Schema Evolution

#### New Tables:
```sql
-- Client Management
CREATE TABLE clients (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    onboarding_status VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE client_projects (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id),
    name VARCHAR NOT NULL,
    phase VARCHAR,
    github_repo VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Trace Management
CREATE TABLE traces (
    id UUID PRIMARY KEY,
    client_project_id UUID REFERENCES client_projects(id),
    complexity_level INTEGER, -- 1-4 for input complexity
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    user_context JSONB,
    self_model_context JSONB,
    epistemic_context JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Open **Coding**
CREATE TABLE labels (
    id UUID PRIMARY KEY,
    trace_id UUID REFERENCES traces(id),
    label_type VARCHAR,
    label_value VARCHAR,
    annotator_id UUID,
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rubrics (
    id UUID PRIMARY KEY,
    client_project_id UUID REFERENCES client_projects(id),
    name VARCHAR NOT NULL,
    version INTEGER,
    criteria JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- LLM Judges
CREATE TABLE llm_judges (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    model_config JSONB,
    training_data_id UUID,
    calibration_score FLOAT,
    performance_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Failure Analysis
CREATE TABLE failure_modes (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    taxonomy_path VARCHAR,
    frequency INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recommendations
CREATE TABLE causal_relationships (
    id UUID PRIMARY KEY,
    cause VARCHAR NOT NULL,
    effect VARCHAR NOT NULL,
    strength FLOAT,
    confidence FLOAT,
    user_context JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Timeline & Dependencies

### Phase Dependencies:
1. **Phase 1** → **Phase 2**: Client infrastructure needed for open coding
2. **Phase 2** → **Phase 3**: Open coding data needed for failure analysis
3. **Phase 3** → **Phase 4**: Failure taxonomy needed for judge training
4. **Phase 4** → **Phase 5**: Judge system needed for recommendation evaluation
5. **Phase 5** → **Phase 6**: Full system needed for comprehensive analytics

### Critical Path:
- **Weeks 1-7**: Phase 1 (Foundation + GitHub Integration + User Management)
- **Weeks 8-12**: Phase 2 (Open Coding)
- **Weeks 13-16**: Phase 3 (Failure Analysis)
- **Weeks 17-22**: Phase 4 (Evaluation System)
- **Weeks 23-29**: Phase 5 (Personalization)
- **Weeks 30-33**: Phase 6 (Analytics)

### Resource Requirements:
- **Frontend Developer**: 1 FTE (React/TypeScript/Next.js)
- **Backend Developer**: 1 FTE (Python/FastAPI/PostgreSQL)
- **ML Engineer**: 0.5 FTE (LLM integration/training)
- **DevOps Engineer**: 0.25 FTE (Infrastructure/deployment)
- **Product Manager**: 0.25 FTE (Requirements/coordination)

---

## Risk Mitigation

### Technical Risks:
1. **LLM Judge Training Complexity**: Mitigate with incremental training approach and fallback to rule-based systems
2. **Performance at Scale**: Implement caching, pagination, and background processing early
3. **Data Quality Issues**: Build validation pipelines and quality metrics from start
4. **Integration Complexity**: Use well-defined APIs and comprehensive testing

### Business Risks:
1. **Client Adoption**: Focus on incremental value delivery and extensive training/documentation
2. **Feature Creep**: Maintain strict phase boundaries and change control processes
3. **Resource Constraints**: Plan for flexible resource allocation and priority adjustments

### Mitigation Strategies:
- **MVP Approach**: Each phase delivers standalone value
- **Continuous Testing**: Automated testing throughout development
- **Regular Demos**: Weekly demos to stakeholders for feedback
- **Documentation**: Comprehensive documentation for all components

---

## Success Metrics

### Phase 1 Success Criteria:
- [ ] 5+ client projects successfully onboarded
- [ ] 1000+ traces collected and validated
- [ ] GitHub integration working for 3+ clients
- [ ] SME training completion rate >80%
- [ ] **Enhanced GitHub Integration**: 3+ client projects with validated GitHub repositories
- [ ] **GitHub Projects**: Automated project board creation for 100% of new projects
- [ ] **Issue Templates**: Standard evaluation issue templates deployed to 3+ repositories
- [ ] **User Management**: 10+ annotation users successfully onboarded across client projects
- [ ] **Trace Assignment**: User-specific trace assignment workflows operational
- [ ] **Session Tracking**: Individual user coding sessions tracked with productivity metrics

### Phase 2 Success Criteria:
- [ ] 100+ traces labeled with >90% inter-annotator agreement
- [ ] 3+ grading rubrics created and versioned
- [ ] Open coding workflow completion time <30 minutes per trace
- [ ] SME satisfaction score >4.0/5.0

### Phase 3 Success Criteria:
- [ ] 20+ failure modes identified and categorized
- [ ] Failure mode taxonomy with >85% coverage
- [ ] Golden trace set with 50+ high-quality examples
- [ ] Automated drift detection with <5% false positives

### Phase 4 Success Criteria:
- [ ] 3+ LLM judges trained with >80% agreement with human evaluators
- [ ] Deterministic checks catching >95% of syntax/structural errors
- [ ] Judge calibration workflow reducing variance by >50%
- [ ] A/B testing framework showing statistically significant results

### Phase 5 Success Criteria:
- [ ] Personalization improving recommendation accuracy by >25%
- [ ] Self-model integration showing measurable impact on user satisfaction
- [ ] Simulation engine running 100+ conversations per hour
- [ ] Recommendation system deployed for 3+ client use cases

### Phase 6 Success Criteria:
- [ ] ROI analysis showing >300% return on implementation investment
- [ ] Client self-sufficiency rate >80%
- [ ] Continuous monitoring detecting issues within <1 hour
- [ ] Knowledge base with 50+ documented best practices

---

## 🚨 STRATEGIC UPDATES SUMMARY

**Based on team comments analysis from 2025-06-18**

### Critical Decisions Made:
1. **Architecture**: Build as reusable client engagement tasks (not generic SDK features)
2. **Workflow**: Support both Input-Focused and Output-Focused analysis paths
3. **Integration**: Include import/export compatibility with other AI eval tools
4. **Security**: Align with MCP server best practices (DD MCP review required)
5. **Process**: Add terminology worksheets and decision gates for every epic

### Implementation Changes Required:
- **Phase 1**: Add client assessment framework and decision checkpoints
- **Phase 2**: Add workflow routing based on Input vs Output focus decision
- **Phase 3**: Add tool integration research and import/export capabilities
- **All Phases**: Convert from features to reusable client engagement tasks

### Next Actions Required:
1. **Get team approval** on strategic decisions above
2. **Research tool integration** requirements with client ecosystem
3. **Review DD MCP** for security best practices
4. **Update GitHub issues** with new requirements from this analysis

See `STRATEGIC_DECISIONS_FRAMEWORK.md` for detailed decision frameworks and implementation requirements.

---

This implementation plan provides a comprehensive roadmap for evolving the Self-Management-Agent into a sophisticated LLM evaluation platform with Epistemic Me personalization capabilities. The phased approach ensures incremental value delivery while building toward the full vision outlined in the customer journey.