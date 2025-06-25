# GitHub Issue Template

## Constraint Compliance Checklist
- [ ] Less than 500 words (not including media)
- [ ] Claude Code can interpret without ambiguity
- [ ] Implementation reviewable in <30 minutes
- [ ] External dependencies clearly listed
- [ ] Review checklist with acceptable/unacceptable states defined
- [ ] **CRITICAL**: Proper GitHub metadata assigned (labels, milestone, project)

---

## Issue Title Format
**REQUIRED**: Use one of these prefixes:
- `[FEATURE] Title` - For new functionality
- `[EPIC X.X] Title` - For epic tracking issues
- `[BUG] Title` - For bug fixes
- `[TASK] Title` - For maintenance/documentation tasks

## GitHub Metadata Requirements
**CRITICAL**: All issues MUST have these metadata fields assigned:

### **Labels (All Required)**:
- **Priority**: `priority:high`, `priority:medium`, or `priority:low`
- **Component**: `component:frontend`, `component:backend`, or `component:fullstack`
- **Phase**: `phase:1-foundation`, `phase:2-open-coding`, `phase:3-failure-analysis`, `phase:4-evaluation`, `phase:5-personalization`, or `phase:6-production-optimization`
- **Epic**: `epic:X.X-name` (e.g., `epic:1.1-client-onboarding`, `epic:1.3-github-integration`)

### **Milestone (Required)**:
Must be assigned to appropriate phase milestone:
- "Phase 1: Foundation & Audit Infrastructure"
- "Phase 2: Open Coding & Analysis Platform"
- "Phase 3: Failure Mode Analysis & Taxonomy"
- "Phase 4: Evaluation System Implementation"
- "Phase 5: Advanced Analytics & Personalization"
- "Phase 6: Production Deployment & Optimization"

### **Assignee (Required)**:
- Must assign to `@jonmc12` or appropriate team member

### **Commands to Apply Metadata**:
```bash
# After creating issue, apply proper metadata:
gh issue edit {number} --add-label "priority:high,component:backend,phase:1-foundation,epic:1.3-github-integration" --milestone "Phase 1: Foundation & Audit Infrastructure"
```

### **For Claude Code Sessions**:
**CRITICAL**: See `docs/templates/CLAUDE_CODE_GITHUB_ISSUE_GUIDE.md` for complete step-by-step process including:
- How to research existing conventions
- Exact commands for metadata application
- Epic label creation process
- Verification steps
- Common mistakes to avoid

**For Sub-Issues Management**: See `docs/templates/GITHUB_SUB_ISSUES_GUIDE.md` for:
- Epic breakdown structure and format
- Sub-issue creation and linking process
- Parent-child relationship management
- Project board hierarchy setup

## Role Assignments
- **Developer**: [What the human developer will do]
- **Claude Code**: [What Claude Code will implement]

## User Observable Acceptance Criteria
When this issue is complete, stakeholders will observe:

1. **User Experience**: [What users will see/do - specific observable behaviors]
2. **Business Impact**: [What business stakeholders will measure]
3. **Technical Function**: [What technical reviewers will verify]

## Implementation Scope
**Time Constraint**: This implementation must be reviewable in <30 minutes

**Claude Code Tasks**:
- [ ] [Specific task 1 - unambiguous]
- [ ] [Specific task 2 - unambiguous]
- [ ] [Regression tests for feature]

**External Dependencies** (Developer manages):
- [ ] [Dependency 1 - what/when/how]
- [ ] [Dependency 2 - what/when/how]

## Review Checklist
Each item has clearly defined acceptable ✅ vs unacceptable ❌ states:

- [ ] **Functional Requirements**
  - ✅ [Specific working behavior]
  - ❌ [Specific failure condition]

- [ ] **Code Quality**
  - ✅ [Specific quality standard]
  - ❌ [Specific quality failure]

- [ ] **Testing**
  - ✅ [Specific test coverage]
  - ❌ [Specific test failure]

## Definition of Done
- [ ] Working implementation deployed
- [ ] Regression tests passing
- [ ] Review checklist completed
- [ ] External dependencies resolved
- [ ] PR created with screenshots and testing instructions

---
**Word Count**: [Keep under 500 words total]