# GitHub Sub-Issues API Reference

Complete API reference for managing GitHub sub-issues and parent-child relationships in the Self-Management-Agent project.

## Overview

GitHub provides native sub-issue functionality through the GraphQL API, allowing epics to have child features that track progress automatically.

## Core API Operations

### 1. Get Issue Node IDs

Required for all sub-issue operations:

```bash
# Get single issue node ID
gh api repos/Epistemic-Me/Self-Management-Agent/issues/{ISSUE_NUMBER} --jq '.node_id'

# Get multiple issue node IDs
gh api graphql -f query='
{
  repository(owner: "Epistemic-Me", name: "Self-Management-Agent") {
    epic: issue(number: {EPIC_NUMBER}) { 
      id 
      title
      number
    }
    feature1: issue(number: {FEATURE_NUMBER_1}) { 
      id 
      title 
      number
    }
    feature2: issue(number: {FEATURE_NUMBER_2}) { 
      id 
      title 
      number
    }
  }
}'
```

### 2. Create Sub-Issue Relationships

Link features as sub-issues to parent epics:

```bash
# Link single feature to epic
gh api graphql -f query='
mutation {
  addSubIssue(input: {
    issueId: "{EPIC_NODE_ID}"
    subIssueId: "{FEATURE_NODE_ID}"
  }) {
    subIssue {
      id
      title
      number
    }
  }
}'

# Alternative using internal IDs (if needed)
gh api repos/Epistemic-Me/Self-Management-Agent/issues/{EPIC_NUMBER}/sub_issues \
  --method POST \
  --field sub_issue_id={FEATURE_INTERNAL_ID}
```

### 3. Remove Sub-Issue Relationships

```bash
# Remove feature from epic
gh api graphql -f query='
mutation {
  removeSubIssue(input: {
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

### 4. Query Sub-Issue Relationships

```bash
# Get all sub-issues for an epic
gh api graphql -f query='
{
  repository(owner: "Epistemic-Me", name: "Self-Management-Agent") {
    issue(number: {EPIC_NUMBER}) {
      title
      subIssues(first: 20) {
        totalCount
        nodes {
          id
          number
          title
          state
          assignees(first: 5) {
            nodes {
              login
            }
          }
        }
      }
    }
  }
}'

# Get parent epic for a feature
gh api graphql -f query='
{
  repository(owner: "Epistemic-Me", name: "Self-Management-Agent") {
    issue(number: {FEATURE_NUMBER}) {
      title
      parentIssue {
        id
        number
        title
      }
    }
  }
}'
```

## Batch Operations

### Link Multiple Features to Epic

```bash
#!/bin/bash
# link_features_to_epic.sh

EPIC_NUMBER=$1
EPIC_NODE_ID=$2
shift 2
FEATURE_NUMBERS=("$@")

echo "Linking features to Epic #${EPIC_NUMBER}..."

for feature_num in "${FEATURE_NUMBERS[@]}"; do
  echo "Processing feature #${feature_num}..."
  
  # Get feature node ID
  feature_node_id=$(gh api repos/Epistemic-Me/Self-Management-Agent/issues/${feature_num} --jq '.node_id')
  
  # Link to epic
  gh api graphql -f query="
  mutation {
    addSubIssue(input: {
      issueId: \"${EPIC_NODE_ID}\"
      subIssueId: \"${feature_node_id}\"
    }) {
      subIssue {
        number
        title
      }
    }
  }" --jq '.data.addSubIssue.subIssue | "Linked #\(.number): \(.title)"'
  
  echo "✅ Linked feature #${feature_num} to Epic #${EPIC_NUMBER}"
done

echo "🎉 All features linked successfully!"

# Usage: ./link_features_to_epic.sh 69 "I_kwDOOy0_MM69WNZ9" 73 74 75 76
```

### Verify Epic Structure

```bash
#!/bin/bash
# verify_epic_structure.sh

EPIC_NUMBER=$1

echo "Verifying Epic #${EPIC_NUMBER} structure..."

# Get epic details with sub-issues
result=$(gh api graphql -f query="
{
  repository(owner: \"Epistemic-Me\", name: \"Self-Management-Agent\") {
    issue(number: ${EPIC_NUMBER}) {
      title
      state
      subIssues(first: 20) {
        totalCount
        nodes {
          number
          title
          state
          labels(first: 10) {
            nodes {
              name
            }
          }
        }
      }
    }
  }
}")

echo "$result" | jq -r '
  .data.repository.issue |
  "Epic: #\(.number // env.EPIC_NUMBER) - \(.title)",
  "State: \(.state)",
  "Sub-issues: \(.subIssues.totalCount)",
  "",
  (.subIssues.nodes[] |
    "  • #\(.number): \(.title) [\(.state)]" +
    (if .labels.nodes | map(.name) | any(startswith("epic:")) then
      " - " + (.labels.nodes | map(.name) | map(select(startswith("epic:"))) | .[0])
     else
      ""
     end)
  )
'

# Usage: ./verify_epic_structure.sh 69
```

## Project Board Integration

### Add Issues to Project Board

```bash
# Add epic and all sub-issues to project
add_epic_to_project() {
  local epic_number=$1
  local project_id="PVT_kwDOCyai2s4A7ryw"
  
  echo "Adding Epic #${epic_number} and sub-issues to project..."
  
  # Get epic and sub-issue node IDs
  local result=$(gh api graphql -f query="
  {
    repository(owner: \"Epistemic-Me\", name: \"Self-Management-Agent\") {
      issue(number: ${epic_number}) {
        id
        title
        subIssues(first: 20) {
          nodes {
            id
            number
            title
          }
        }
      }
    }
  }")
  
  # Add epic to project
  local epic_node_id=$(echo "$result" | jq -r '.data.repository.issue.id')
  gh api graphql -f query="
  mutation {
    addProjectV2ItemById(input: {
      projectId: \"${project_id}\"
      contentId: \"${epic_node_id}\"
    }) {
      item { id }
    }
  }" --jq '.data.addProjectV2ItemById.item.id // "Failed to add epic"'
  
  # Add each sub-issue to project
  echo "$result" | jq -r '.data.repository.issue.subIssues.nodes[] | "\(.id) \(.number) \(.title)"' | while read node_id number title; do
    gh api graphql -f query="
    mutation {
      addProjectV2ItemById(input: {
        projectId: \"${project_id}\"
        contentId: \"${node_id}\"
      }) {
        item { id }
      }
    }" --jq '.data.addProjectV2ItemById.item.id // "Failed"' > /dev/null
    echo "✅ Added #${number} to project: ${title}"
  done
  
  echo "🎉 Epic #${epic_number} and all sub-issues added to project!"
}

# Usage: add_epic_to_project 69
```

## Current Project Structure

### Active Epic Relationships

Based on the consolidated epic structure:

```bash
# Epic 2.3: Working Memory (WM) - Issue #69
# Sub-issues: #73, #74, #75, #76

# Epic 3.3: Provenance Manager (PM) - Issue #70  
# Sub-issues: #77, #78, #79, #80

# Epic 5.3: Self-Model (SM) - Issue #71
# Sub-issues: #81, #82, #83, #84

# Epic 6.3: Epistemic Model (EM) - Issue #72
# Sub-issues: #85, #86, #87, #88
```

### Verify All Current Relationships

```bash
#!/bin/bash
# verify_all_epics.sh

EPICS=(69 70 71 72)

echo "🔍 Verifying all epic structures..."
echo "================================="

for epic in "${EPICS[@]}"; do
  echo ""
  echo "Epic #${epic}:"
  echo "-------------"
  
  gh api graphql -f query="
  {
    repository(owner: \"Epistemic-Me\", name: \"Self-Management-Agent\") {
      issue(number: ${epic}) {
        title
        subIssues(first: 10) {
          totalCount
          nodes {
            number
            title
            state
          }
        }
      }
    }
  }" --jq '
    .data.repository.issue |
    "Title: \(.title)",
    "Sub-issues: \(.subIssues.totalCount)",
    (.subIssues.nodes[] | "  • #\(.number): \(.title) [\(.state)]")
  '
done

echo ""
echo "🎉 Verification complete!"
```

## Error Handling

### Common Error Scenarios

```bash
# Error: Issue not found
{
  "errors": [
    {
      "message": "Could not resolve to an Issue with the number 999",
      "type": "NOT_FOUND"
    }
  ]
}

# Error: Already linked as sub-issue
{
  "errors": [
    {
      "message": "Issue is already a sub-issue of this issue",
      "type": "UNPROCESSABLE"
    }
  ]
}

# Error: Circular reference
{
  "errors": [
    {
      "message": "Cannot add issue as sub-issue of itself",
      "type": "UNPROCESSABLE"
    }
  ]
}
```

### Error Recovery Scripts

```bash
#!/bin/bash
# fix_broken_relationships.sh

check_and_fix_relationship() {
  local epic_num=$1
  local feature_num=$2
  
  echo "Checking relationship: Epic #${epic_num} -> Feature #${feature_num}"
  
  # Check if relationship exists
  local exists=$(gh api graphql -f query="
  {
    repository(owner: \"Epistemic-Me\", name: \"Self-Management-Agent\") {
      issue(number: ${epic_num}) {
        subIssues(first: 20) {
          nodes {
            number
          }
        }
      }
    }
  }" --jq ".data.repository.issue.subIssues.nodes[] | select(.number == ${feature_num}) | .number")
  
  if [[ -z "$exists" ]]; then
    echo "❌ Relationship missing, creating..."
    
    # Get node IDs and create relationship
    local epic_node_id=$(gh api repos/Epistemic-Me/Self-Management-Agent/issues/${epic_num} --jq '.node_id')
    local feature_node_id=$(gh api repos/Epistemic-Me/Self-Management-Agent/issues/${feature_num} --jq '.node_id')
    
    gh api graphql -f query="
    mutation {
      addSubIssue(input: {
        issueId: \"${epic_node_id}\"
        subIssueId: \"${feature_node_id}\"
      }) {
        subIssue {
          number
        }
      }
    }" --jq '.data.addSubIssue.subIssue.number // "Failed"'
    
    echo "✅ Fixed relationship: Epic #${epic_num} -> Feature #${feature_num}"
  else
    echo "✅ Relationship exists: Epic #${epic_num} -> Feature #${feature_num}"
  fi
}

# Fix all known relationships
check_and_fix_relationship 69 73
check_and_fix_relationship 69 74  
check_and_fix_relationship 69 75
check_and_fix_relationship 69 76
# Add more as needed...
```

This API reference provides complete coverage for managing GitHub sub-issues in alignment with the Memory×Provenance×Self-Model project structure.