# Phase 1 Implementation Guide

This guide will walk you through setting up Phase 1 of the Epistemic Me LLM Evaluation Platform in your GitHub repository.

## 🚀 Quick Start (30 minutes)

### Step 1: Create Milestone (2 minutes)

Navigate to your repository and create the Phase 1 milestone:

1. Go to `https://github.com/Epistemic-Me/Self-Management-Agent/milestones`
2. Click "New milestone"
3. **Title**: `Phase 1: Foundation & Audit Infrastructure`
4. **Due date**: Set to 4 weeks from today
5. **Description**: 
   ```
   Client onboarding, trace collection, and project management infrastructure.
   
   Success Criteria:
   - 5+ client projects successfully onboarded
   - GitHub integration working for 3+ clients
   - SME training completion rate >80%
   - 1000+ traces collected and validated
   ```

### Step 2: Create Essential Labels (5 minutes)

Go to `https://github.com/Epistemic-Me/Self-Management-Agent/labels` and create these labels:

**Priority Labels:**
- `priority:critical` - #DC2626 (Dark Red)
- `priority:high` - #F59E0B (Orange) 
- `priority:medium` - #10B981 (Green)

**Component Labels:**
- `component:frontend` - #3B82F6 (Blue)
- `component:backend` - #10B981 (Green)
- `component:database` - #8B5CF6 (Purple)

**Type Labels:**
- `type:epic` - #8B5CF6 (Purple)
- `type:feature` - #22C55E (Bright Green)

**Phase Labels:**
- `phase:1-foundation` - #FEE2E2 (Light Red)

**Epic Labels:**
- `epic:1.1-client-onboarding` - #FEE2E2 (Light Red)
- `epic:1.2-auth-access` - #FEF3C7 (Light Yellow)

### Step 3: Create Project Board (3 minutes)

1. Go to `https://github.com/Epistemic-Me/Self-Management-Agent/projects`
2. Click "New project" → "Board"
3. **Name**: `Epistemic Me Platform Development`
4. **Description**: `LLM Evaluation & Personalization Platform - All Phases`
5. Add columns:
   - 📋 **Backlog**
   - 🔄 **Ready** 
   - 👨‍💻 **In Progress**
   - 👀 **In Review**
   - ✅ **Done**

### Step 4: Create Issues (20 minutes)

Create these issues in this order (copy/paste the content):

---

## Issue #1: Epic 1.1 - Client Onboarding System

**Title**: `[EPIC 1.1] Client Onboarding & Project Management System`

**Labels**: `type:epic`, `epic:1.1-client-onboarding`, `phase:1-foundation`, `priority:high`

**Assign to**: Phase 1 milestone

**Description**:
```markdown
## Epic Objective
Create systematic client onboarding and project management capabilities that enable Epistemic Me to efficiently manage multiple client projects with standardized workflows.

## Value Proposition
- Reduces client onboarding time from weeks to days
- Provides standardized project templates and workflows  
- Enables tracking of multiple client projects simultaneously
- Creates automated GitHub integration for project setup

## Success Criteria
- [ ] 5+ client projects successfully onboarded using new system
- [ ] Client onboarding time reduced by 60% vs manual process
- [ ] 100% of new projects use standardized templates
- [ ] GitHub integration works for 3+ client projects
- [ ] Client satisfaction score >4.0/5.0 for onboarding experience

## User Stories
- [ ] #2 - Client Portal Landing Page
- [ ] #3 - Project Setup Wizard  
- [ ] #4 - Team Access Management
- [ ] #5 - GitHub Integration Service
- [ ] #6 - Client Documentation System
- [ ] #7 - Project Progress Dashboard

## Implementation Notes
Reference the detailed UI mockups in `IMPLEMENTATION_PLAN.md` Phase 1 section for specific interface requirements.
```

---

## Issue #2: Client Portal Landing Page

**Title**: `[FEATURE] Client Portal Landing Page with Progress Tracking`

**Labels**: `type:feature`, `epic:1.1-client-onboarding`, `phase:1-foundation`, `priority:high`, `component:frontend`

**Assign to**: Phase 1 milestone

**Description**:
```markdown
## User Story
**As a** client project manager  
**I want** a welcoming dashboard that shows my project setup progress  
**So that** I can understand what steps remain and feel confident about the onboarding process

## Acceptance Criteria
- [ ] Landing page displays project setup progress (5 steps: Account, Repository, Traces, Training, Kickoff)
- [ ] Progress bar shows percentage completion with visual indicators
- [ ] Each completed step shows green checkmark, in-progress shows spinner, pending shows empty circle
- [ ] Action buttons: "Continue Setup", "Schedule Support Call", "View Guide"
- [ ] Responsive design works on desktop and mobile
- [ ] Page loads in <2 seconds
- [ ] Matches design system established in existing web-ui

## Design Reference
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

## Technical Notes
- Build on existing Next.js web-ui foundation in `/src/app/client-portal/`
- Use existing UI components and design system
- Progress should be persistent across browser sessions
- Integrate with project data model from backend

## Complexity Estimate
Medium (3-5 days)

## Dependencies
- Requires basic authentication system
- Needs project data model definition
```

---

## Issue #3: Project Setup Wizard

**Title**: `[FEATURE] Interactive Project Setup Wizard`

**Labels**: `type:feature`, `epic:1.1-client-onboarding`, `phase:1-foundation`, `priority:high`, `component:frontend`

**Assign to**: Phase 1 milestone

**Description**:
```markdown
## User Story
**As a** client project manager  
**I want** a step-by-step wizard to configure my evaluation project  
**So that** I can provide all necessary information without missing critical details

## Acceptance Criteria
- [ ] Step 1: Basic project information (name, description, domain)
- [ ] Step 2: Team member setup (SMEs, developers, stakeholders)
- [ ] Step 3: Evaluation scope definition (trace types, quality criteria)
- [ ] Step 4: Integration preferences (GitHub, notification settings)
- [ ] Step 5: Review and confirmation with summary
- [ ] Navigation: Previous/Next buttons, step indicator, save draft capability
- [ ] Form validation with helpful error messages
- [ ] Auto-save progress every 30 seconds
- [ ] Ability to exit and resume later

## Technical Implementation
- Multi-step form component with React Hook Form
- Form state management with local storage backup
- API integration for project creation
- Error handling with user-friendly messages

## Complexity Estimate
Large (1-2 weeks)

## Dependencies
- Issue #2 (Landing page for navigation)
- Backend API for project creation
```

---

## Issue #4: Multi-Tenant Data Architecture

**Title**: `[FEATURE] Multi-Tenant Data Isolation Architecture`

**Labels**: `type:feature`, `epic:1.2-auth-access`, `phase:1-foundation`, `priority:critical`, `component:database`

**Assign to**: Phase 1 milestone

**Description**:
```markdown
## User Story
**As a** platform administrator  
**I want** complete data isolation between client projects  
**So that** clients cannot access each other's sensitive evaluation data under any circumstances

## Acceptance Criteria
- [ ] Database schema supports client-specific data partitioning
- [ ] All API endpoints filter data by client context automatically
- [ ] Row-level security policies implemented where applicable
- [ ] Data migration scripts for existing data
- [ ] Performance testing shows no degradation with multiple tenants
- [ ] Security testing confirms no data leakage between clients
- [ ] Backup and restore procedures respect tenant boundaries
- [ ] Database monitoring for tenant resource usage

## Technical Approach
- Add `client_id` field to all relevant tables
- Implement database middleware for automatic filtering
- Use PostgreSQL Row Level Security (RLS) policies
- Create database views for client-specific data access

## Security Considerations
- All queries must include client context
- API endpoints require client authentication
- Database connections pool by client when needed
- Audit all cross-tenant data access attempts

## Complexity Estimate
Extra Large (2+ weeks)

## Dependencies
- Database migration strategy
- Performance testing framework
```

---

## Issue #5: Trace Collection Framework

**Title**: `[FEATURE] Systematic Trace Collection and Validation System`

**Labels**: `type:feature`, `phase:1-foundation`, `priority:high`, `component:backend`

**Assign to**: Phase 1 milestone

**Description**:
```markdown
## User Story
**As a** client data manager  
**I want** reliable tools to collect and validate conversation traces  
**So that** we can build a high-quality dataset for evaluation without manual quality checking

## Acceptance Criteria
- [ ] Support multiple input formats (CSV, JSON, API integration)
- [ ] Bulk upload with progress tracking and error reporting
- [ ] Automatic data validation and quality scoring
- [ ] Duplicate detection and handling options
- [ ] Data transformation and standardization
- [ ] Preview and sampling capabilities before import
- [ ] Export functionality for processed datasets
- [ ] Integration with existing data sources (CRM, support tools)

## UI Reference
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
│ [Upload New Traces] [Validate Dataset] [Export Sample]     │
└─────────────────────────────────────────────────────────────┘
```

## Technical Implementation
- FastAPI endpoints for upload/validation
- Pandas/Polars for data processing
- Redis for progress tracking
- MinIO/S3 for file storage

## Complexity Estimate
Large (1-2 weeks)
```

---

## Next Steps After Creating Issues

### 1. Assign Team Members (5 minutes)
- Assign issues to team members based on expertise
- Frontend issues → Frontend developer
- Backend/Database issues → Backend developer  
- Epic ownership → Product manager or tech lead

### 2. Set Up Project Board Automation (5 minutes)
1. Go to your project board
2. Click "⚙️" next to each column
3. Set up automation:
   - **Backlog**: Newly created issues
   - **Ready**: Issues with assignees
   - **In Progress**: Issues with "In Progress" status
   - **In Review**: Pull requests opened
   - **Done**: Issues/PRs closed

### 3. Create Issue Templates (10 minutes)
Create `.github/ISSUE_TEMPLATE/feature.yml`:

```yaml
name: Feature Request
about: Propose a new feature for the platform
title: '[FEATURE] '
labels: ['type:feature']

body:
  - type: input
    id: epic
    attributes:
      label: Epic
      description: Which epic does this belong to?
      placeholder: "Epic 2.1: Open Coding Application"
    validations:
      required: true

  - type: textarea
    id: user-story
    attributes:
      label: User Story
      description: As a [user type], I want [functionality] so that [benefit]
    validations:
      required: true

  - type: textarea
    id: acceptance-criteria
    attributes:
      label: Acceptance Criteria
      description: List requirements with checkboxes
      placeholder: |
        - [ ] Criterion 1
        - [ ] Criterion 2
    validations:
      required: true
```

## 📊 Phase 1 Success Metrics

Track these metrics weekly:

**Development Progress:**
- Issues completed vs planned
- Pull requests merged vs opened
- Code review cycle time

**Quality Metrics:**
- Test coverage >80%
- No critical security vulnerabilities
- Performance benchmarks met

**Client Readiness:**
- Demo environment functional
- Documentation complete
- Team training materials ready

## 🎯 Phase 1 Completion Criteria

Phase 1 is complete when:
- [ ] All 15 issues resolved and tested
- [ ] Client onboarding flow functional end-to-end
- [ ] Multi-tenant architecture secure and performant
- [ ] Trace collection processing 1000+ traces successfully
- [ ] Demo ready for first client onboarding
- [ ] Team prepared for Phase 2 planning

This gives you a solid foundation to launch Phase 1 development immediately while maintaining the structure needed for the full 30-week implementation.