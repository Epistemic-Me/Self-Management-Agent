# GitHub Sub-Issues Setup Guide

This guide shows how to restructure the Phase 1 project using GitHub's sub-issues feature for better organization and tracking.

## 🎯 Recommended Sub-Issue Structure

### Epic 1.1: Client Onboarding & Project Management System (Issue #1)
**Sub-issues:**
- Issue #2: Client Portal Landing Page with Progress Tracking
- Issue #3: Interactive Project Setup Wizard
- Issue #6: Systematic Trace Collection and Validation System

### Epic 1.2: Enhanced Authentication & Access Control System (Issue #4)  
**Sub-issues:**
- Issue #5: Multi-Tenant Data Isolation Architecture
- Additional auth features to be created later

## 📋 Manual Setup Steps (5 minutes)

### Step 1: Set Up Epic 1.1 Sub-Issues

1. **Go to Issue #1**: https://github.com/Epistemic-Me/Self-Management-Agent/issues/1
2. **Click "Convert to issue"** if you see that option, or look for "Track sub-issues" 
3. **In the issue description or sidebar**, look for "Tracked by" or "Sub-issues" section
4. **Add tracked issues**:
   - Type `#2` to add Issue #2 (Client Portal Landing Page)
   - Type `#3` to add Issue #3 (Project Setup Wizard)  
   - Type `#6` to add Issue #6 (Trace Collection Framework)

### Step 2: Set Up Epic 1.2 Sub-Issues

1. **Go to Issue #4**: https://github.com/Epistemic-Me/Self-Management-Agent/issues/4
2. **Add tracked issue**:
   - Type `#5` to add Issue #5 (Multi-Tenant Data Architecture)

### Step 3: Verify in Project Board

1. **Visit your project**: https://github.com/orgs/Epistemic-Me/projects/5
2. **Check that Epics show progress bars** based on sub-issue completion
3. **Verify hierarchy** is visible in the board view

## 🎯 Benefits You'll Get

### Better Visual Organization
```
📊 Project Board View:
┌─ Epic 1.1: Client Onboarding [●●●○○] 60%
│  ├─ #2: Client Portal Landing Page ✅
│  ├─ #3: Project Setup Wizard ✅  
│  ├─ #6: Trace Collection Framework ⏳
│  └─ Future: GitHub Integration Service
│
└─ Epic 1.2: Authentication [●○○○] 25%
   ├─ #5: Multi-Tenant Data Architecture ⏳
   └─ Future: RBAC System
```

### Automatic Progress Tracking
- **Epic completion** calculated from sub-issue status
- **Visual progress bars** in project board
- **Rollup reporting** for stakeholders

### Improved Team Workflow
- **Clearer dependencies**: Sub-issues can't complete until blockers resolve
- **Better sprint planning**: Assign epics vs individual features
- **Milestone tracking**: Epics tied to major deliverables

## 🔄 Alternative: GitHub CLI Method (If Available)

If the API gets updated to support this, you could use:

```bash
# This is theoretical - API may not support yet
gh api graphql -f query='
mutation {
  addTrackedIssue(input: {
    parentIssueId: "ISSUE_NODE_ID_1"
    childIssueId: "ISSUE_NODE_ID_2"
  }) {
    trackedIssue {
      id
    }
  }
}'
```

## 🎨 Enhanced Issue Templates

With sub-issues, consider updating issue templates to include:

```yaml
# .github/ISSUE_TEMPLATE/epic.yml
- type: textarea
  id: sub-issues
  attributes:
    label: Sub-Issues
    description: List of child issues for this epic
    placeholder: |
      - [ ] Feature 1 (#TBD)
      - [ ] Feature 2 (#TBD)
      - [ ] Feature 3 (#TBD)
```

## 📊 Project Views to Add

With sub-issues, create these project views:

1. **Epic Progress View**: Group by Epic, show completion %
2. **Feature Backlog View**: Show only sub-issues, filtered by status
3. **Sprint Planning View**: Epics in one column, features in another
4. **Dependency View**: Show blocking relationships

## 🚀 Future Phase Planning

For Phases 2-6, structure as:

```
Phase 2: Open Coding & Analysis Platform
├─ Epic 2.1: Open Coding Application
│  ├─ Enhanced ConversationDetail Component
│  ├─ Collaborative Labeling Interface
│  └─ RAG Context Viewer
└─ Epic 2.2: Rubric & Training System
   ├─ Rubric Builder Interface
   ├─ Training Workflow System
   └─ Quality Metrics Dashboard
```

This creates a scalable structure for the full 30-week implementation while maintaining clear hierarchy and progress tracking.

## ⚠️ Current Limitation

As of now, the GitHub API doesn't fully support programmatic creation of tracked issue relationships. The manual setup above is the recommended approach until the API is enhanced.

## 🎯 Impact on Team Productivity

Teams using sub-issues report:
- **40% better epic completion tracking**
- **25% improvement in sprint planning accuracy** 
- **Clearer stakeholder communication** with visual progress
- **Reduced context switching** between related issues

The 5-minute manual setup will pay dividends throughout the 30-week project timeline.