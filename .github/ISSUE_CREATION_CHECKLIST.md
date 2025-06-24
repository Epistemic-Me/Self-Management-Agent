# GitHub Issue Creation Checklist

## Required Metadata (ALL ISSUES MUST HAVE)

### 1. Type Label
- [ ] Add `type:feature` for features
- [ ] Add `type:bug` for bugs  
- [ ] Add `type:epic` for epics

### 2. Priority Label
- [ ] Add `priority:high`, `priority:medium`, or `priority:low`

### 3. Phase Label
- [ ] Add appropriate `phase:X-description` label matching the epic

### 4. Epic Label  
- [ ] Add `epic:X.X-description` label matching the parent epic

### 5. Project Assignment
- [ ] Add to "Self-Management Agent - Customer Journey" project
- [ ] Command: `gh api graphql -f query='mutation {addProjectV2ItemById(input: {projectId: "PVT_kwDOCyai2s4A7ryw", contentId: "ISSUE_NODE_ID"}) {item {id}}}'`

### 6. Milestone
- [ ] Set milestone matching the epic's phase

### 7. Assignee
- [ ] Assign to appropriate developer

### 8. Parent Relationship
- [ ] Reference parent epic in issue body: `**Parent Issue**: #XX (Epic X.X - Epic Name)`
- [ ] Add comment to parent epic with task checkbox: `- [ ] #XX Issue Title`

## Content Requirements

### Issue Body Must Include:
- [ ] **Parent Issue** reference
- [ ] **Issue Type** declaration  
- [ ] Clear problem statement
- [ ] Acceptance criteria with ✅ sections
- [ ] External resources section
- [ ] Review checklist with Acceptable/Unacceptable states
- [ ] Implementation notes

### Word Count Constraint:
- [ ] Less than 500 words (excluding code blocks)

## GitHub CLI Commands

### Get Issue Node ID:
```bash
gh api repos/Epistemic-Me/Self-Management-Agent/issues/ISSUE_NUMBER --jq '.node_id'
```

### Add to Project:
```bash
gh api graphql -f query='mutation {addProjectV2ItemById(input: {projectId: "PVT_kwDOCyai2s4A7ryw", contentId: "ISSUE_NODE_ID"}) {item {id}}}'
```

### Add Labels:
```bash
gh issue edit ISSUE_NUMBER --add-label "type:feature" --add-label "priority:high" --add-label "phase:2-open-coding" --add-label "epic:2.1-open-coding"
```

### Set Milestone:
```bash
gh issue edit ISSUE_NUMBER --milestone "Phase 2: Open Coding & Analysis Platform"
```

### Create Parent Relationship:
```bash
gh issue comment PARENT_ISSUE_NUMBER --body "Adding sub-issue: #ISSUE_NUMBER - Issue Title

- [ ] #ISSUE_NUMBER Issue Title"
```

## Verification Steps

After creating issue, verify:
- [ ] Type shows correctly in GitHub UI
- [ ] Project assignment visible
- [ ] Milestone set correctly  
- [ ] Parent epic has task checkbox
- [ ] All labels applied correctly
- [ ] Issue follows constraint format

## Common Mistakes to Avoid

❌ **Don't**: Forget to add type label  
❌ **Don't**: Skip project assignment  
❌ **Don't**: Forget parent relationship  
❌ **Don't**: Exceed 500 word limit  
❌ **Don't**: Use vague acceptance criteria  

✅ **Do**: Follow this checklist completely  
✅ **Do**: Test all GitHub CLI commands  
✅ **Do**: Verify UI shows all metadata  
✅ **Do**: Create clear parent-child relationships  