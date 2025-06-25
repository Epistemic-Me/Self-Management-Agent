# GitHub Sub-Issues Management Guide

## Overview

Epics in this repository use a structured approach to manage sub-issues (Features) that implement the epic's functionality. This guide documents the process for creating and linking sub-issues to parent epics.

## Sub-Issue Structure Convention

### Epic Body Format
All epics should include this section in their body:

```markdown
## Epic Breakdown (Sub-Issues):
- [ ] Issue #{NUMBER}: {FEATURE_TITLE}
- [ ] Issue #{NUMBER}: {FEATURE_TITLE}
```

### Feature Issue Requirements
Each feature issue that implements part of an epic must:

1. **Reference Parent Epic**: Include "**Parent Epic**: #{EPIC_NUMBER}" in issue body
2. **Use Epic Label**: Apply the epic label (e.g., `epic:1.3-github-integration`)
3. **Same Milestone**: Assigned to same milestone as parent epic
4. **Feature Type**: Set issue type to "Feature"

## Process for Adding Sub-Issues

### Step 1: Create Epic Issue
```bash
# Create epic with proper structure including sub-issues section
gh issue create --title "[EPIC X.X] Epic Title" --body "Epic content with sub-issues section"
```

### Step 2: Create Feature Issues
```bash
# Create each feature issue
gh issue create --title "[FEATURE] Feature Title" --body "Feature content with Parent Epic reference"
```

### Step 3: Apply Metadata to Features
```bash
# Add all required metadata including epic label
gh issue edit {FEATURE_NUMBER} \
  --add-label "priority:high,component:backend,phase:X-foundation,epic:X.X-epic-name" \
  --milestone "Phase X: Title"
```

### Step 4: Set Issue Types
```bash
# Set epic type
gh api graphql -f query='
mutation {
  updateIssue(input: {
    id: "{EPIC_NODE_ID}"
    issueTypeId: "IT_kwDOCyai2s4Bocg9"
  }) {
    issue { issueType { name } }
  }
}'

# Set feature type
gh api graphql -f query='
mutation {
  updateIssue(input: {
    id: "{FEATURE_NODE_ID}"
    issueTypeId: "IT_kwDOCyai2s4BcIYs"
  }) {
    issue { issueType { name } }
  }
}'
```

### Step 5: Add All Issues to Project
```bash
# Add epic to project
gh api graphql -f query='
mutation {
  addProjectV2ItemById(input: {
    projectId: "PVT_kwDOCyai2s4A7ryw"
    contentId: "{EPIC_NODE_ID}"
  }) {
    item { id }
  }
}'

# Add each feature to project
gh api graphql -f query='
mutation {
  addProjectV2ItemById(input: {
    projectId: "PVT_kwDOCyai2s4A7ryw"
    contentId: "{FEATURE_NODE_ID}"
  }) {
    item { id }
  }
}'
```

### Step 6: Update Epic with Feature References
```bash
# Update epic body to reference actual issue numbers
gh issue edit {EPIC_NUMBER} --body "Updated epic body with correct issue references"
```

### Step 7: Create Sub-Issue Relationships
**CRITICAL: Link features as sub-issues to their parent epic:**

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

## GitHub's Sub-Issue Functionality

### Native Sub-Issue Support
GitHub provides native sub-issue functionality through the GraphQL API using the `addSubIssue` mutation:

```bash
# Link feature as sub-issue to parent epic
gh api graphql -f query='
mutation {
  addSubIssue(input: {
    issueId: "{PARENT_EPIC_NODE_ID}"
    subIssueId: "{FEATURE_ISSUE_NODE_ID}"
  }) {
    subIssue {
      id
      title
    }
  }
}'
```

This creates proper parent-child relationships visible in GitHub's interface.

### Step 6.5: Create Sub-Issue Relationships
**Add this step after adding issues to project:**

```bash
# Get both issue node IDs
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

## Verification Checklist

After creating sub-issues, verify:

### Epic Issue:
- [ ] Contains "Epic Breakdown (Sub-Issues):" section
- [ ] Lists all feature issues with checkboxes
- [ ] Has epic type set
- [ ] Added to project board
- [ ] All required metadata applied

### Feature Issues:
- [ ] References parent epic in body
- [ ] Uses same epic label as parent
- [ ] Assigned to same milestone
- [ ] Has feature type set
- [ ] Added to project board
- [ ] All required metadata applied
- [ ] **CRITICAL**: Linked as sub-issue to parent epic using `addSubIssue` mutation

### Project Board:
- [ ] All issues visible on board
- [ ] Parent-child relationships clear
- [ ] Proper epic/feature categorization

## Example: Complete Epic with Sub-Issues

```markdown
# [EPIC 1.3] Enhanced GitHub Integration

## Epic Overview
Enhanced GitHub repository and project management integration for Phase 1.

## Epic Breakdown (Sub-Issues):
- [ ] Issue #57: Enhanced GitHub Repository Integration
- [ ] Issue #58: GitHub Project Board Automation  
- [ ] Issue #59: Issue Template Management

## Epic Success Criteria
- [ ] All sub-issues completed and tested
- [ ] GitHub integration workflow documented
- [ ] End-to-end testing completed
```

## Common Patterns

### Epic Numbering: `X.Y`
- X = Phase number (1-6)
- Y = Epic number within phase (1, 2, 3...)

### Feature Naming: Descriptive
- Should clearly indicate what functionality is being implemented
- Should be specific enough to be implemented in <30 minutes review time

### Label Consistency
- Epic and all sub-features use same epic label
- Same phase label across all related issues
- Appropriate component labels (frontend, backend, fullstack)

## Troubleshooting

### Sub-Issues Not Showing in GitHub UI
- Ensure proper parent-child relationships in project board
- Check that epic breakdown section is properly formatted
- Verify all issues are added to same project

### Progress Tracking Issues
- Epic progress should reflect completion of sub-issues
- Use checkboxes in epic breakdown section for manual tracking
- Project board automation can help with status updates

### Navigation Issues
- Ensure bidirectional references (epic → features, features → epic)
- Use consistent issue numbering in epic breakdown
- Maintain proper linking in issue descriptions

## Best Practices

1. **Create Epics First**: Always create the epic before creating sub-features
2. **Consistent Metadata**: Use same labels, milestones, and project assignments
3. **Clear References**: Maintain bidirectional links between epics and features
4. **Regular Updates**: Keep epic breakdown section current with actual issue numbers
5. **Verification**: Always verify relationships are visible in project board and GitHub UI