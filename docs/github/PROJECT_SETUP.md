# GitHub Project Setup Guide

Complete setup instructions for the Epistemic Me LLM Evaluation & Personalization Platform project management on GitHub.

## Project Overview
- **Repository**: https://github.com/Epistemic-Me/Self-Management-Agent
- **Project Type**: Memory×Provenance×Self-Model Evaluation Platform
- **Timeline**: 14 weeks (6 phases)
- **Architecture**: L0→L1→L2→L3→L4 evaluation progression

---

## Step 1: Create GitHub Milestones

Create these 6 milestones aligned with the unified implementation plan:

### Milestone 1: Foundation & Audit Infrastructure
- **Title**: Phase 1: Foundation & Audit Infrastructure
- **Due Date**: +4 weeks from project start
- **Description**: Trace collection, failure analysis, and project setup infrastructure

### Milestone 2: Open Coding & Analysis Platform
- **Title**: Phase 2: Open Coding & Analysis Platform
- **Due Date**: +8 weeks from project start
- **Description**: Collaborative trace labeling and L1 Working Memory implementation

### Milestone 3: Failure Mode Analysis & Taxonomy
- **Title**: Phase 3: Failure Mode Analysis & Taxonomy
- **Due Date**: +11 weeks from project start
- **Description**: L2 Provenance tracking and systematic failure analysis

### Milestone 4: Evaluation System Implementation
- **Title**: Phase 4: Evaluation System Implementation
- **Due Date**: +17 weeks from project start
- **Description**: LLM judge training and automated evaluation with L1+L2 integration

### Milestone 5: Advanced Analytics & Personalization
- **Title**: Phase 5: Advanced Analytics & Personalization
- **Due Date**: +23 weeks from project start
- **Description**: L3 Self-Model implementation and adaptive agent behavior

### Milestone 6: Production Deployment & Optimization
- **Title**: Phase 6: Production Deployment & Optimization
- **Due Date**: +26 weeks from project start
- **Description**: L4 Epistemic Model and comprehensive ROI analytics

---

## Step 2: Create GitHub Labels

### Epic Labels (Updated for Consolidated Structure)
```bash
# Phase 1 - Foundation
gh label create "epic:1.1-foundation" --description "Foundation & Audit Infrastructure" --color "FEE2E2"

# Phase 2 - Open Coding & Memory
gh label create "epic:2.1-open-coding" --description "Open Coding Application" --color "DBEAFE"
gh label create "epic:2.2-grading-rubric" --description "Grading Rubric & Training System" --color "E0E7FF"
gh label create "epic:2.3-working-memory" --description "Working Memory (WM) - L1 Agent" --color "F0F9FF"

# Phase 3 - Failure Analysis & Provenance
gh label create "epic:3.1-failure-analysis" --description "Failure Analysis Workbench" --color "F3E8FF"
gh label create "epic:3.2-taxonomy-builder" --description "Taxonomy Builder & Golden Traces" --color "ECFDF5"
gh label create "epic:3.3-provenance" --description "Provenance Manager (PM) - L2 Multi-turn" --color "FEF3C7"

# Phase 4 - Evaluation System
gh label create "epic:4.1-evaluation-system" --description "Evaluation System Implementation" --color "FEF7CD"

# Phase 5 - Self-Model & Personalization
gh label create "epic:5.1-self-model-input" --description "Self-Model Enhanced Input System" --color "E0F2FE"
gh label create "epic:5.2-recommendation-engine" --description "Personalized Recommendation Engine" --color "DCFCE7"
gh label create "epic:5.3-self-model" --description "Self-Model (SM) - L3 Adaptive Agent" --color "F0FDF4"

# Phase 6 - Analytics & ROI
gh label create "epic:6.1-performance-analytics" --description "Performance Analytics & ROI Assessment" --color "FDF4FF"
gh label create "epic:6.2-knowledge-management" --description "Knowledge Management & Continuous Improvement" --color "F0F9FF"
gh label create "epic:6.3-epistemic-model" --description "Epistemic Model (EM) - L4 Personalized" --color "FFFBEB"
```

### Phase Labels
```bash
gh label create "phase:1-foundation" --description "Phase 1: Foundation & Audit" --color "FEE2E2"
gh label create "phase:2-open-coding" --description "Phase 2: Open Coding & Analysis" --color "DBEAFE"
gh label create "phase:3-failure-analysis" --description "Phase 3: Failure Analysis & Taxonomy" --color "F3E8FF"
gh label create "phase:4-evaluation" --description "Phase 4: Evaluation System" --color "FEF7CD"
gh label create "phase:5-personalization" --description "Phase 5: Personalization" --color "E0F2FE"
gh label create "phase:6-analytics" --description "Phase 6: Analytics & ROI" --color "FDF4FF"
```

### Component Labels
```bash
gh label create "component:frontend" --description "Frontend component" --color "3B82F6"
gh label create "component:backend" --description "Backend component" --color "10B981"
gh label create "component:ui-ux" --description "UI/UX component" --color "F59E0B"
gh label create "component:database" --description "Database component" --color "8B5CF6"
gh label create "component:api" --description "API component" --color "EF4444"
gh label create "component:integration" --description "Integration component" --color "6B7280"
```

### Priority Labels
```bash
gh label create "priority:critical" --description "Critical priority" --color "DC2626"
gh label create "priority:high" --description "High priority" --color "F59E0B"
gh label create "priority:medium" --description "Medium priority" --color "10B981"
gh label create "priority:low" --description "Low priority" --color "6B7280"
```

### Type Labels
```bash
gh label create "type:epic" --description "Epic issue type" --color "8B5CF6"
gh label create "type:feature" --description "Feature issue type" --color "22C55E"
gh label create "type:bug" --description "Bug issue type" --color "EF4444"
gh label create "type:enhancement" --description "Enhancement issue type" --color "3B82F6"
gh label create "type:documentation" --description "Documentation issue type" --color "F59E0B"
gh label create "type:research" --description "Research issue type" --color "8B5CF6"
gh label create "type:testing" --description "Testing issue type" --color "06B6D4"
```

---

## Step 3: Create Project Board

Set up a GitHub Project (Beta) with these columns:

### Board Columns
1. **📋 Backlog** - All planned issues
2. **🔄 Ready** - Issues ready to start  
3. **👨‍💻 In Progress** - Currently being worked on
4. **👀 In Review** - Under code review
5. **🧪 Testing** - In QA/testing phase
6. **✅ Done** - Completed issues

### Board Views
1. **By Phase** - Group by phase labels
2. **By Epic** - Group by epic labels
3. **By Assignee** - Group by team member
4. **By Priority** - Group by priority level
5. **L0-L4 Progression** - Group by evaluation level

---

## Step 4: Issue Templates

Create these issue templates in `.github/ISSUE_TEMPLATE/`:

### Epic Template (`epic.yml`)
```yaml
name: Epic
about: Create a new epic for major functionality
title: '[EPIC X.X] '
labels: ['type:epic']
assignees: ''

body:
  - type: markdown
    attributes:
      value: |
        ## Epic Guidelines
        - Epics represent major functionality aligned with Memory×Provenance×Self-Model architecture
        - Use numbering: Phase.Epic (e.g., 1.1, 2.3, 3.3)
        - Include L0-L4 evaluation level where applicable

  - type: input
    id: phase
    attributes:
      label: Phase
      description: Which phase does this epic belong to?
      placeholder: "Phase 2: Open Coding & Analysis Platform"
    validations:
      required: true

  - type: input
    id: evaluation-level
    attributes:
      label: Evaluation Level
      description: Which L0-L4 level does this epic target?
      placeholder: "L1 (Working Memory) or L2 (Provenance) etc."

  - type: textarea
    id: objective
    attributes:
      label: Epic Objective
      description: High-level goal aligned with Memory×Provenance×Self-Model architecture
    validations:
      required: true

  - type: textarea
    id: business-value
    attributes:
      label: Business Value
      description: What concrete value does this epic deliver?
    validations:
      required: true

  - type: textarea
    id: technical-scope
    attributes:
      label: Technical Scope
      description: Core components and integration points
      placeholder: |
        ### Core Components
        - Component 1: Description
        - Component 2: Description
        
        ### Integration Points
        - Integration 1: Description
        - Integration 2: Description

  - type: textarea
    id: success-criteria
    attributes:
      label: Success Criteria
      description: Measurable outcomes for epic completion
      placeholder: |
        ✅ **Technical Implementation**
        - [ ] Criterion 1
        - [ ] Criterion 2
        
        ✅ **Performance Metrics**
        - [ ] Metric 1: Target value
        - [ ] Metric 2: Target value
    validations:
      required: true

  - type: textarea
    id: sub-issues
    attributes:
      label: Sub-Issues
      description: List of feature issues that implement this epic
      placeholder: |
        - [ ] #XX: Feature 1 description
        - [ ] #XX: Feature 2 description
        - [ ] #XX: Feature 3 description
```

### Feature Template (`feature.yml`)
```yaml
name: Feature Request
about: Propose a new feature for the platform
title: '[FEATURE] '
labels: ['type:feature']
assignees: ''

body:
  - type: markdown
    attributes:
      value: |
        ## Feature Guidelines
        - Features implement specific functionality within an epic
        - Reference parent epic and include epic label
        - Should be completable within 1-2 weeks

  - type: input
    id: parent-epic
    attributes:
      label: Parent Epic
      description: Which epic does this feature belong to?
      placeholder: "Epic 2.3: Working Memory (Issue #69)"
    validations:
      required: true

  - type: textarea
    id: user-story
    attributes:
      label: User Story
      description: Describe the feature as a user story
      placeholder: "As a [user type], I want [functionality] so that [benefit]"
    validations:
      required: true

  - type: textarea
    id: acceptance-criteria
    attributes:
      label: Acceptance Criteria
      description: Specific requirements for completion
      placeholder: |
        - [ ] Functional requirement 1
        - [ ] Functional requirement 2
        - [ ] Performance requirement 3
        - [ ] Integration requirement 4
    validations:
      required: true

  - type: textarea
    id: technical-details
    attributes:
      label: Technical Implementation
      description: API endpoints, database changes, architecture considerations
      placeholder: |
        ### API Endpoints
        - POST /api/...
        - GET /api/...
        
        ### Database Changes
        - Table modifications
        - New schemas
        
        ### Integration Points
        - Service dependencies
        - External APIs

  - type: dropdown
    id: complexity
    attributes:
      label: Complexity Estimate
      description: Development effort estimate
      options:
        - Small (1-3 days)
        - Medium (4-7 days)
        - Large (1-2 weeks)
    validations:
      required: true
```

### Bug Report Template (`bug.yml`)
```yaml
name: Bug Report
about: Report a bug in the platform
title: '[BUG] '
labels: ['type:bug']
assignees: ''

body:
  - type: textarea
    id: description
    attributes:
      label: Bug Description
      description: Clear description of the bug
    validations:
      required: true

  - type: textarea
    id: reproduce
    attributes:
      label: Steps to Reproduce
      description: Detailed steps to reproduce the behavior
      placeholder: |
        1. Go to '...'
        2. Click on '....'
        3. Observe behavior
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: Expected Behavior
      description: What should happen
    validations:
      required: true

  - type: textarea
    id: actual
    attributes:
      label: Actual Behavior
      description: What actually happens
    validations:
      required: true

  - type: input
    id: environment
    attributes:
      label: Environment
      description: Browser, OS, version details
      placeholder: "Chrome 91, macOS 11.4, Node 16.x"

  - type: dropdown
    id: severity
    attributes:
      label: Severity
      description: Impact level
      options:
        - Critical (blocks development)
        - High (major functionality affected)
        - Medium (some functionality affected)
        - Low (minor issue)
    validations:
      required: true
```

---

## Step 5: Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes implementing Memory×Provenance×Self-Model architecture.

## Related Issues
- Closes #[issue number]
- Implements Epic: #[epic number]
- Related to #[issue number]

## Type of Change
- [ ] L0: I/O Evaluation enhancement
- [ ] L1: Working Memory implementation
- [ ] L2: Provenance tracking feature
- [ ] L3: Self-Model integration
- [ ] L4: Epistemic Model feature
- [ ] Bug fix (non-breaking change)
- [ ] Documentation update
- [ ] Performance improvement

## Architecture Alignment
- [ ] Aligns with Memory×Provenance×Self-Model thesis
- [ ] Integrates properly with L0-L4 evaluation levels
- [ ] Maintains backward compatibility with existing layers
- [ ] Follows established API patterns

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests with other layers
- [ ] Performance testing (if applicable)
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced
- [ ] Tests pass locally
- [ ] Epic progress updated

## Performance Impact
Describe any performance implications for the evaluation pipeline.

## Screenshots/Demo
Include screenshots for UI changes or links to demo for new functionality.
```

---

## Step 6: Sub-Issue Management

### Creating Sub-Issue Relationships
```bash
# Get issue node IDs
gh api graphql -f query='
{
  repository(owner: "Epistemic-Me", name: "Self-Management-Agent") {
    epic: issue(number: {EPIC_NUMBER}) { id title }
    feature: issue(number: {FEATURE_NUMBER}) { id title }
  }
}'

# Create sub-issue relationship
gh api graphql -f query='
mutation {
  addSubIssue(input: {
    issueId: "{EPIC_NODE_ID}"
    subIssueId: "{FEATURE_NODE_ID}"
  }) {
    subIssue {
      id
      title
    }
  }
}'
```

### Project Board Management
```bash
# Add issue to project
gh api graphql -f query='
mutation {
  addProjectV2ItemById(input: {
    projectId: "PVT_kwDOCyai2s4A7ryw"
    contentId: "{ISSUE_NODE_ID}"
  }) {
    item { id }
  }
}'
```

---

## Current Epic Structure (Post-Consolidation)

### Active Epics
| Epic | Phase | Status | Sub-Issues |
|------|-------|--------|------------|
| Epic 1.1: Foundation & Audit Infrastructure | Phase 1 | Active | TBD |
| Epic 2.1: Open Coding Application | Phase 2 | Active | #67 |
| Epic 2.3: Working Memory (WM) | Phase 2 | Active | #73-76 |
| Epic 3.3: Provenance Manager (PM) | Phase 3 | Active | #77-80 |
| Epic 4.1: Evaluation System Implementation | Phase 4 | Active | TBD |
| Epic 5.3: Self-Model (SM) | Phase 5 | Active | #81-84 |
| Epic 6.3: Epistemic Model (EM) | Phase 6 | Active | #85-88 |

### Consolidated Epics (Closed)
- Epic 1.2: Systematic Trace Management → Consolidated into Epic 1.1
- Epic 1.3: Collaborative Evaluation → Consolidated into Epic 1.1  
- Epic 1.4: User-Based Open Coding Foundation → Consolidated into Epic 1.1
- Epic 4.2: Automated Evaluation System → Consolidated into Epic 4.1

---

This setup provides complete GitHub project management aligned with the unified Memory×Provenance×Self-Model implementation plan, enabling systematic tracking of L0-L4 evaluation progression across all 6 phases.