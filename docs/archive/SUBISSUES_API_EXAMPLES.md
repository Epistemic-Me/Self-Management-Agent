# GitHub Sub-Issues API Examples

Complete examples for using GitHub's new sub-issues API (December 2024 release).

## GraphQL API Examples

### Required Header
All GraphQL sub-issues operations require this header:
```
GraphQL-Features: sub_issues
```

### 1. Add Sub-Issue (GraphQL)

```graphql
mutation AddSubIssue($parentId: ID!, $childId: ID!) {
  addSubIssue(input: {
    issueId: $parentId,
    subIssueId: $childId
  }) {
    issue {
      id
      title
      number
      subIssues(first: 10) {
        nodes {
          id
          title
          number
        }
      }
      subIssuesSummary {
        total
        completed
        percentCompleted
      }
    }
    subIssue {
      id
      title
      number
      parent {
        id
        title
        number
      }
    }
  }
}
```

**Using GitHub CLI:**
```bash
gh api graphql -H "GraphQL-Features: sub_issues" \
  -f query='mutation { addSubIssue(input: { issueId: "I_kwDOCyai2s6L-ABC", subIssueId: "I_kwDOCyai2s6L-DEF" }) { issue { title number } subIssue { title number } } }'
```

### 2. Query Sub-Issues with Progress

```graphql
query GetIssueWithSubIssues($issueId: ID!) {
  node(id: $issueId) {
    ... on Issue {
      id
      title
      number
      subIssues(first: 20) {
        nodes {
          id
          title
          number
          state
          assignees(first: 3) {
            nodes {
              login
            }
          }
        }
      }
      subIssuesSummary {
        total
        completed
        percentCompleted
      }
    }
  }
}
```

### 3. Remove Sub-Issue (GraphQL)

```graphql
mutation RemoveSubIssue($parentId: ID!, $childId: ID!) {
  removeSubIssue(input: {
    issueId: $parentId,
    subIssueId: $childId
  }) {
    issue {
      title
      subIssues(first: 10) {
        nodes {
          title
        }
      }
    }
  }
}
```

### 4. Reprioritize Sub-Issue (GraphQL)

```graphql
mutation ReprioritizeSubIssue($parentId: ID!, $subIssueId: ID!, $afterId: ID) {
  reprioritizeSubIssue(input: {
    issueId: $parentId,
    subIssueId: $subIssueId,
    afterId: $afterId
  }) {
    issue {
      title
      subIssues(first: 10) {
        nodes {
          title
          number
        }
      }
    }
  }
}
```

## REST API Examples

### 1. Add Sub-Issue (REST)

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d '{"sub_issue_id": 456}' \
  https://api.github.com/repos/OWNER/REPO/issues/123/sub_issues
```

**Using GitHub CLI:**
```bash
gh api -X POST /repos/OWNER/REPO/issues/123/sub_issues -f sub_issue_id=456
```

### 2. List Sub-Issues (REST)

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO/issues/123/sub_issues
```

**Using GitHub CLI:**
```bash
gh api /repos/OWNER/REPO/issues/123/sub_issues
```

### 3. Remove Sub-Issue (REST)

```bash
curl -X DELETE \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d '{"sub_issue_id": 456}' \
  https://api.github.com/repos/OWNER/REPO/issues/123/sub_issue
```

**Using GitHub CLI:**
```bash
gh api -X DELETE /repos/OWNER/REPO/issues/123/sub_issue -f sub_issue_id=456
```

### 4. Reprioritize Sub-Issue (REST)

```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d '{"sub_issue_id": 456, "after_id": 789}' \
  https://api.github.com/repos/OWNER/REPO/issues/123/sub_issues/priority
```

## Complete Node.js Implementation

```javascript
import { Octokit } from "@octokit/rest";

class GitHubSubIssues {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
  }

  // GraphQL method to add sub-issue
  async addSubIssueGraphQL(parentIssueId, childIssueId) {
    const mutation = `
      mutation {
        addSubIssue(input: {
          issueId: "${parentIssueId}",
          subIssueId: "${childIssueId}"
        }) {
          issue {
            title
            number
            subIssuesSummary {
              total
              completed
              percentCompleted
            }
          }
          subIssue {
            title
            number
          }
        }
      }
    `;

    return await this.octokit.graphql(mutation, {
      headers: {
        'GraphQL-Features': 'sub_issues'
      }
    });
  }

  // REST method to add sub-issue
  async addSubIssueREST(owner, repo, parentIssueNumber, childIssueNumber) {
    return await this.octokit.rest.request('POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues', {
      owner,
      repo,
      issue_number: parentIssueNumber,
      sub_issue_id: childIssueNumber
    });
  }

  // Get issue node ID (needed for GraphQL)
  async getIssueNodeId(owner, repo, issueNumber) {
    const query = `
      query {
        repository(owner: "${owner}", name: "${repo}") {
          issue(number: ${issueNumber}) {
            id
            title
          }
        }
      }
    `;

    const result = await this.octokit.graphql(query, {
      headers: {
        'GraphQL-Features': 'sub_issues'
      }
    });

    return result.repository.issue.id;
  }

  // Complete setup for Phase 1 structure
  async setupPhase1SubIssues(owner, repo) {
    console.log("Setting up Phase 1 sub-issues...");

    // Get node IDs for all issues
    const issue1Id = await this.getIssueNodeId(owner, repo, 1); // Epic 1.1
    const issue2Id = await this.getIssueNodeId(owner, repo, 2); // Client Portal
    const issue3Id = await this.getIssueNodeId(owner, repo, 3); // Setup Wizard
    const issue4Id = await this.getIssueNodeId(owner, repo, 4); // Epic 1.2
    const issue5Id = await this.getIssueNodeId(owner, repo, 5); // Multi-tenant
    const issue6Id = await this.getIssueNodeId(owner, repo, 6); // Trace Collection

    // Create Epic 1.1 sub-issues
    console.log("Creating Epic 1.1 sub-issues...");
    await this.addSubIssueGraphQL(issue1Id, issue2Id); // #1 -> #2
    await this.addSubIssueGraphQL(issue1Id, issue3Id); // #1 -> #3
    await this.addSubIssueGraphQL(issue1Id, issue6Id); // #1 -> #6

    // Create Epic 1.2 sub-issues
    console.log("Creating Epic 1.2 sub-issues...");
    await this.addSubIssueGraphQL(issue4Id, issue5Id); // #4 -> #5

    console.log("✅ All sub-issues created successfully!");
  }
}

// Usage example
const subIssues = new GitHubSubIssues('your_github_token');
await subIssues.setupPhase1SubIssues('Epistemic-Me', 'Self-Management-Agent');
```

## Python Implementation

```python
import requests
import json

class GitHubSubIssues:
    def __init__(self, token):
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        }
        self.graphql_headers = {
            **self.headers,
            'GraphQL-Features': 'sub_issues'
        }

    def add_sub_issue_graphql(self, parent_id, child_id):
        query = f"""
        mutation {{
          addSubIssue(input: {{
            issueId: "{parent_id}",
            subIssueId: "{child_id}"
          }}) {{
            issue {{
              title
              number
            }}
            subIssue {{
              title
              number
            }}
          }}
        }}
        """
        
        response = requests.post(
            'https://api.github.com/graphql',
            headers=self.graphql_headers,
            json={'query': query}
        )
        return response.json()

    def get_issue_node_id(self, owner, repo, issue_number):
        query = f"""
        query {{
          repository(owner: "{owner}", name: "{repo}") {{
            issue(number: {issue_number}) {{
              id
              title
            }}
          }}
        }}
        """
        
        response = requests.post(
            'https://api.github.com/graphql',
            headers=self.graphql_headers,
            json={'query': query}
        )
        return response.json()['data']['repository']['issue']['id']

    def setup_phase1_subissues(self, owner, repo):
        print("Setting up Phase 1 sub-issues...")
        
        # Get all issue node IDs
        issue_ids = {}
        for i in range(1, 7):
            issue_ids[i] = self.get_issue_node_id(owner, repo, i)
        
        # Create sub-issue relationships
        print("Creating Epic 1.1 sub-issues...")
        self.add_sub_issue_graphql(issue_ids[1], issue_ids[2])  # #1 -> #2
        self.add_sub_issue_graphql(issue_ids[1], issue_ids[3])  # #1 -> #3
        self.add_sub_issue_graphql(issue_ids[1], issue_ids[6])  # #1 -> #6
        
        print("Creating Epic 1.2 sub-issues...")
        self.add_sub_issue_graphql(issue_ids[4], issue_ids[5])  # #4 -> #5
        
        print("✅ All sub-issues created successfully!")

# Usage
github = GitHubSubIssues('your_github_token')
github.setup_phase1_subissues('Epistemic-Me', 'Self-Management-Agent')
```

## Key Benefits

With these API implementations, you get:

- **Automatic Progress Tracking**: Epic completion percentages in GitHub UI
- **Visual Hierarchy**: Clear parent-child relationships in issues
- **Project Board Integration**: Sub-issue progress rolls up to epics
- **Cross-Repository Support**: Sub-issues can span multiple repositories
- **API Control**: Full programmatic management of relationships
- **Real-time Updates**: Changes reflect immediately in GitHub interface

## Implementation Notes

1. **GraphQL vs REST**: GraphQL provides more detailed responses and better relationship querying
2. **Node IDs**: GraphQL requires global node IDs, while REST uses issue numbers
3. **Headers**: GraphQL operations require `GraphQL-Features: sub_issues` header
4. **Rate Limits**: Both APIs respect GitHub's rate limiting policies
5. **Permissions**: Requires "Issues" repository write access

This API support transforms the project management experience with native GitHub integration and automatic progress tracking.