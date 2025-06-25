# GitHub Project Management Documentation

Complete documentation for managing the Self-Management-Agent project on GitHub, aligned with the Memory×Provenance×Self-Model implementation plan.

## Documentation Overview

### 📋 Project Setup
- **[PROJECT_SETUP.md](./PROJECT_SETUP.md)** - Complete GitHub project configuration
  - Milestone creation for 6 phases
  - Label creation with exact colors and descriptions
  - Project board setup and automation
  - Issue templates for epics, features, and bugs
  - Pull request templates

### 🔗 Sub-Issues Management  
- **[SUB_ISSUES_API.md](./SUB_ISSUES_API.md)** - GitHub API for parent-child relationships
  - Complete API reference for sub-issue operations
  - Batch scripts for linking features to epics
  - Verification and error recovery tools
  - Project board integration commands

### 📚 Templates Reference
- **[../templates/](../templates/)** - Reusable templates and guides
  - Issue creation workflows
  - GitHub CLI automation scripts
  - Project management best practices

## Quick Start Guide

### 1. Initial Project Setup
```bash
# Navigate to project root
cd /path/to/Self-Management-Agent

# Run complete project setup (labels, milestones, etc.)
# See PROJECT_SETUP.md for detailed commands
```

### 2. Create Epic with Sub-Issues
```bash
# 1. Create epic issue
gh issue create --title "[EPIC X.X] Epic Title" --template epic.yml

# 2. Create feature issues  
gh issue create --title "[FEATURE] Feature Title" --template feature.yml

# 3. Link features as sub-issues (using node IDs)
# See SUB_ISSUES_API.md for complete scripts
```

### 3. Project Board Management
```bash
# Add issues to project board
gh api graphql -f query='...' # See SUB_ISSUES_API.md

# Verify epic structure
./verify_epic_structure.sh {EPIC_NUMBER}
```

## Current Project Structure

### Phase Alignment
| Phase | Milestone | Epic | Status |
|-------|-----------|------|--------|
| **Phase 1** | Foundation & Audit Infrastructure | Epic 1.1 | ✅ Active |
| **Phase 2** | Open Coding & Analysis Platform | Epic 2.1, 2.3 | ✅ Active |
| **Phase 3** | Failure Mode Analysis & Taxonomy | Epic 3.3 | ✅ Active |
| **Phase 4** | Evaluation System Implementation | Epic 4.1 | ✅ Active |
| **Phase 5** | Advanced Analytics & Personalization | Epic 5.3 | ✅ Active |
| **Phase 6** | Production Deployment & Optimization | Epic 6.3 | ✅ Active |

### Epic-Feature Relationships
- **Epic 2.3** (Working Memory): Features #73-76 ✅
- **Epic 3.3** (Provenance): Features #77-80 ✅  
- **Epic 5.3** (Self-Model): Features #81-84 ✅
- **Epic 6.3** (Epistemic Model): Features #85-88 ✅

### Consolidated Epics (Archived)
- Epic 1.2, 1.3, 1.4 → Consolidated into Epic 1.1
- Epic 4.2 → Consolidated into Epic 4.1

## Architecture Integration

### Memory×Provenance×Self-Model Alignment
- **L0**: Traditional I/O evaluation (baseline)
- **L1**: Working Memory - Epic 2.3 with Redis-based context
- **L2**: Provenance - Epic 3.3 with decision lineage tracking  
- **L3**: Self-Model - Epic 5.3 with belief extraction and adaptation
- **L4**: Epistemic Model - Epic 6.3 with personalized recommendations

### 90-Day Timeline Integration
| Weeks | Focus | Epic | Evaluation Level |
|-------|-------|------|------------------|
| 1-4 | Foundation | Epic 1.1 | L0 Setup |
| 5-6 | Working Memory | Epic 2.3 | L1 Implementation |
| 7-8 | Provenance | Epic 3.3 | L2 Implementation |
| 9-10 | Evaluation System | Epic 4.1 | L1+L2 Integration |
| 11-12 | Self-Model | Epic 5.3 | L3 Implementation |
| 13-14 | Epistemic Model | Epic 6.3 | L4 Implementation |

## Best Practices

### Epic Management
1. **One Epic Per Phase Core Component** - Simplified structure for clarity
2. **Clear L0-L4 Progression** - Each epic builds on previous evaluation levels
3. **Sub-Issue Granularity** - Features should be 1-2 week implementation cycles
4. **Milestone Alignment** - All epic components assigned to phase milestones

### Issue Workflow
1. **Epic Creation** - Use epic template with business value and technical scope
2. **Feature Breakdown** - Create specific, actionable sub-issues
3. **Relationship Linking** - Use GitHub API to establish parent-child relationships
4. **Progress Tracking** - Monitor epic completion through sub-issue status

### Label Consistency
- **Epic Labels**: Follow `epic:X.Y-component` pattern
- **Phase Labels**: Use `phase:X-description` format  
- **Type Labels**: Distinguish epics, features, bugs clearly
- **Component Labels**: Indicate frontend, backend, API, etc.

## Automation Scripts

### Available Scripts
- `verify_epic_structure.sh` - Check epic-feature relationships
- `link_features_to_epic.sh` - Batch link features to parent epic
- `add_epic_to_project.sh` - Add epic and sub-issues to project board
- `fix_broken_relationships.sh` - Repair missing parent-child links

### CI/CD Integration
- Auto-assign labels based on file changes
- Update project board status on PR merge
- Validate epic-feature relationships on issue creation
- Generate progress reports for stakeholder updates

## Troubleshooting

### Common Issues
1. **Sub-issues not showing** - Verify node IDs and API calls
2. **Project board missing items** - Check project ID and content IDs
3. **Milestone assignment failures** - Ensure milestone exists before assignment
4. **Label creation conflicts** - Handle existing labels gracefully

### Support Resources
- GitHub GraphQL API documentation
- GitHub CLI reference
- Project automation examples
- Issue template validation

This documentation provides complete guidance for managing the Self-Management-Agent project in alignment with the Memory×Provenance×Self-Model implementation plan.