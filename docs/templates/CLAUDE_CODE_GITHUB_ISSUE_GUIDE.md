# Claude Code GitHub Issue Creation Guide

## CRITICAL REQUIREMENTS

**❌ NEVER create GitHub issues without proper metadata**
**✅ ALWAYS follow this exact process for every issue**

## Step-by-Step Process

### 1. Research Existing Conventions
**ALWAYS do this first before creating any issue:**

```bash
# Check existing issues to understand current patterns
gh issue list --limit 10 --json number,title,labels,milestone

# Check available milestones
gh api repos/:owner/:repo/milestones

# Check available epic labels
gh api repos/:owner/:repo/labels | jq '.[] | select(.name | contains("epic")) | {name: .name, description: .description}'
```

### 2. Create Issue with Basic Content
```bash
gh issue create --title "[FEATURE] Your Title Here" --body "$(cat <<'EOF'
[Your properly formatted issue content following template]
EOF
)" --assignee @me
```

### 3. IMMEDIATELY Add Required Metadata
**This step is CRITICAL and must never be skipped:**

```bash
# Example for Phase 1 GitHub integration feature:
gh issue edit {ISSUE_NUMBER} \
  --add-label "priority:high,component:backend,phase:1-foundation,epic:1.3-github-integration" \
  --milestone "Phase 1: Foundation & Audit Infrastructure"
```

### 4. CRITICAL: Set Issue Type
**This step is REQUIRED for proper issue categorization:**

```bash
# Set issue type using GraphQL API
# Available types and IDs:
# Feature: "IT_kwDOCyai2s4BcIYs" 
# Epic: "IT_kwDOCyai2s4Bocg9"
# Bug: "IT_kwDOCyai2s4BcIYr"
# Task: "IT_kwDOCyai2s4BcIYq"

gh api graphql -f query='
mutation {
  updateIssue(input: {
    id: "{ISSUE_NODE_ID_FROM_STEP_3}"
    issueTypeId: "IT_kwDOCyai2s4BcIYs"
  }) {
    issue {
      id
      title
      issueType {
        name
      }
    }
  }
}'
```

### 5. CRITICAL: Establish Parent-Child Relationships
**For Feature issues, link them to their parent Epic:**

```bash
# Add parent epic reference to feature issue body
gh issue edit {FEATURE_ISSUE_NUMBER} --body "$(gh issue view {FEATURE_ISSUE_NUMBER} --json body --jq '.body')

**Parent Epic**: #{EPIC_ISSUE_NUMBER}"

# Add feature as task list item in epic issue
gh issue edit {EPIC_ISSUE_NUMBER} --body "$(gh issue view {EPIC_ISSUE_NUMBER} --json body --jq '.body')

## Related Features
- [ ] #{FEATURE_ISSUE_NUMBER}: {FEATURE_TITLE}"
```

### 6.5. CRITICAL: Create Sub-Issue Relationships
**Link Feature issues as sub-issues to their parent Epic using GitHub's native functionality:**

```bash
# Get both issue node IDs
gh api graphql -f query='
{
  repository(owner: "Epistemic-Me", name: "Self-Management-Agent") {
    epic: issue(number: {EPIC_NUMBER}) { id title }
    feature: issue(number: {FEATURE_NUMBER}) { id title }
  }
}'

# Create sub-issue relationship using returned node IDs
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

### 6. CRITICAL: Add Issues to GitHub Project
**This step is REQUIRED for project board visibility:**

```bash
# First, get the issue node ID
gh api graphql -f query='
{
  repository(owner: "Epistemic-Me", name: "Self-Management-Agent") {
    issue(number: {ISSUE_NUMBER}) {
      id
      title
    }
  }
}'

# Then add to project (use the returned node ID)
gh api graphql -f query='
mutation {
  addProjectV2ItemById(input: {
    projectId: "PVT_kwDOCyai2s4A7ryw"
    contentId: "{NODE_ID_FROM_ABOVE}"
  }) {
    item {
      id
    }
  }
}'
```

**Project Information:**
- Project Name: "Self-Management Agent - Customer Journey"
- Project ID: `PVT_kwDOCyai2s4A7ryw`
- Project URL: https://github.com/orgs/Epistemic-Me/projects/5

## Required Metadata Fields

### Labels (ALL 4 Required)
1. **Priority**: `priority:high`, `priority:medium`, `priority:low`
2. **Component**: `component:frontend`, `component:backend`, `component:fullstack`
3. **Phase**: `phase:1-foundation`, `phase:2-open-coding`, `phase:3-failure-analysis`, `phase:4-evaluation`, `phase:5-personalization`, `phase:6-production-optimization`
4. **Epic**: `epic:X.X-name` (must match existing epic or create new epic label first)

### Milestone (Required)
Must match one of these exactly:
- "Phase 1: Foundation & Audit Infrastructure"
- "Phase 2: Open Coding & Analysis Platform"
- "Phase 3: Failure Mode Analysis & Taxonomy"
- "Phase 4: Evaluation System Implementation"
- "Phase 5: Advanced Analytics & Personalization"
- "Phase 6: Production Deployment & Optimization"

### Assignee (Required)
- Always assign to `@me` (which resolves to current user)

## Creating New Epic Labels

If you need a new epic label that doesn't exist:

```bash
# Create the epic label first
gh api repos/:owner/:repo/labels -X POST \
  -f name="epic:1.3-github-integration" \
  -f description="Epic 1.3 GitHub Integration" \
  -f color="6EE7B7"
```

## Epic Numbering Convention
- **Phase 1**: epic:1.1, epic:1.2, epic:1.3, epic:1.4...
- **Phase 2**: epic:2.1, epic:2.2, epic:2.3...
- **Phase 3**: epic:3.1, epic:3.2...
- etc.

## Epic Color Scheme
- Phase 1 epics: Green variations (`6EE7B7`, `34D399`, `10B981`)
- Phase 2 epics: Blue variations (`3B82F6`, `1D4ED8`, `1E40AF`)
- Phase 3 epics: Purple variations (`8B5CF6`, `7C3AED`, `6D28D9`)
- Phase 4 epics: Orange variations (`F59E0B`, `D97706`, `B45309`)
- Phase 5 epics: Pink variations (`EC4899`, `DB2777`, `BE185D`)
- Phase 6 epics: Red variations (`EF4444`, `DC2626`, `B91C1C`)

## Verification Checklist

After creating an issue, verify:
- [ ] Issue has proper `[FEATURE]` or `[EPIC X.X]` title format
- [ ] All 4 required labels are applied (priority, component, phase, epic)
- [ ] Correct milestone is assigned
- [ ] Issue is assigned to appropriate team member
- [ ] Epic label exists and follows numbering convention
- [ ] **CRITICAL**: Issue Type is set (Feature, Epic, Bug, or Task)
- [ ] **CRITICAL**: Parent-child relationships established (Features linked to Epics)
- [ ] **CRITICAL**: Feature issues linked as sub-issues using `addSubIssue` mutation
- [ ] **CRITICAL**: Issue is added to GitHub project and visible on project board

## Common Mistakes to Avoid

❌ **DON'T**: Create issues without metadata
❌ **DON'T**: Use custom label names that don't follow conventions
❌ **DON'T**: Assign to wrong milestones
❌ **DON'T**: Create epics without proper numbering
❌ **DON'T**: Skip the research step before creating issues
❌ **DON'T**: Forget to set the issue Type field
❌ **DON'T**: Forget to establish parent-child relationships
❌ **DON'T**: Forget to add issues to the GitHub project board

✅ **DO**: Always research existing patterns first
✅ **DO**: Follow exact label naming conventions
✅ **DO**: Create epic labels before using them
✅ **DO**: Set appropriate issue Type (Feature/Epic/Bug/Task)
✅ **DO**: Link Feature issues to their parent Epics
✅ **DO**: Verify all metadata is properly applied
✅ **DO**: Add issues to GitHub project for visibility

## Example Complete Issue Creation

```bash
# 1. Research (always first)
gh issue list --limit 5 --json number,title,labels,milestone

# 2. Create epic label if needed
gh api repos/:owner/:repo/labels -X POST \
  -f name="epic:1.4-user-management" \
  -f description="Epic 1.4 User Management" \
  -f color="34D399"

# 3. Create issue
gh issue create --title "[FEATURE] User-Based Trace Assignment System" --body "$(cat <<'EOF'
[Properly formatted issue content]
EOF
)" --assignee @me

# 4. Apply metadata immediately (replace 58 with actual issue number)
gh issue edit 58 \
  --add-label "priority:high,component:backend,phase:1-foundation,epic:1.4-user-management" \
  --milestone "Phase 1: Foundation & Audit Infrastructure"

# 5. Set issue type (Feature for this example)
gh api graphql -f query='
mutation {
  updateIssue(input: {
    id: "I_kwDOOy0_MM68uhXo"
    issueTypeId: "IT_kwDOCyai2s4BcIYs"
  }) {
    issue {
      issueType {
        name
      }
    }
  }
}'

# 6. Establish parent-child relationship
gh issue edit 58 --body "$(gh issue view 58 --json body --jq '.body')

**Parent Epic**: #60"

gh issue edit 60 --body "$(gh issue view 60 --json body --jq '.body')

## Related Features
- [ ] #58: User-Based Trace Assignment System"

# 7. Add to GitHub project
gh api graphql -f query='
{
  repository(owner: "Epistemic-Me", name: "Self-Management-Agent") {
    issue(number: 58) {
      id
      title
    }
  }
}'

# Use the returned node ID in this mutation:
gh api graphql -f query='
mutation {
  addProjectV2ItemById(input: {
    projectId: "PVT_kwDOCyai2s4A7ryw"
    contentId: "I_kwDOOy0_MM68uhXo"
  }) {
    item {
      id
    }
  }
}'

# 8. Verify everything
gh issue view 58 --json labels,milestone,assignees
```

## Critical Success Factors

1. **Research First**: Always examine existing issues and conventions
2. **Follow Conventions**: Use exact label names and milestone titles
3. **Create Dependencies**: Create epic labels before using them
4. **Apply Immediately**: Add metadata right after issue creation
5. **Set Issue Type**: Properly categorize as Feature, Epic, Bug, or Task
6. **Link Relationships**: Establish parent-child relationships between Features and Epics
7. **Add to Project**: Ensure issues appear on GitHub project board
8. **Verify Always**: Check that all metadata was applied correctly and issue is visible on project board

**Remember**: Proper project management depends on consistent metadata, proper relationships, AND project board visibility. Issues without proper labels, milestones, assignments, type, parent-child links, and project association cannot be effectively tracked or prioritized.