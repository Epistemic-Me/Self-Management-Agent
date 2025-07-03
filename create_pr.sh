#!/bin/bash

# Create PR for Agent Evaluation feature

echo "Creating PR for Agent Evaluation feature..."

# First, let's check the current git status
echo "Current git status:"
git status

# Create a new branch for the feature
BRANCH_NAME="feature/agent-evaluation-hierarchical-constraints"
echo -e "\nCreating new branch: $BRANCH_NAME"
git checkout -b $BRANCH_NAME

# Add the new files
echo -e "\nAdding new files..."
git add web-ui/src/types/agent-evaluation.ts
git add web-ui/src/app/agent-evaluation/page.tsx
git add web-ui/src/components/AgentEvaluation/HierarchicalTree.tsx
git add web-ui/src/components/AgentEvaluation/ConstraintManager.tsx
git add web-ui/src/components/AgentEvaluation/EvaluationMetrics.tsx
git add web-ui/src/components/AgentEvaluation/OpenCodingIntegration.tsx
git add web-ui/src/pages/api/agent-evaluation/hierarchy.ts
git add web-ui/src/pages/api/agent-evaluation/constraints/\[nodeId\].ts
git add web-ui/src/pages/api/agent-evaluation/metrics/\[nodeId\].ts
git add web-ui/src/components/ui/input.tsx
git add web-ui/src/components/ui/select.tsx

# Add modified files
echo -e "\nAdding modified files..."
git add web-ui/src/components/SidebarNav.tsx

# Show what will be committed
echo -e "\nFiles to be committed:"
git status --short

# Create the commit
echo -e "\nCreating commit..."
git commit -m "feat: Add Agent Evaluation with Hierarchical Constraint Architecture

- Implement hierarchical constraint-based evaluation system
- Add interactive tree visualization for agent hierarchy
- Create constraint management with category support
- Integrate with existing open coding workflow
- Add API endpoints for hierarchy and metrics management
- Update sidebar navigation with Agent Evaluation link

This feature helps developers navigate the 'three gulfs' of LLM development
by providing systematic evaluation through constraint analysis and failure
mode prediction.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push the branch
echo -e "\nPushing branch to remote..."
git push -u origin $BRANCH_NAME

# Create PR using GitHub CLI
echo -e "\nCreating pull request..."
gh pr create \
  --title "feat: Agent Evaluation - Hierarchical Constraint Architecture" \
  --body "$(cat <<'EOF'
## Summary
- Implements hierarchical constraint-based evaluation system for LLM agents
- Integrates with existing open coding workflow for failure mode analysis
- Provides interactive tree visualization with constraint management

## Related Issue
Closes #64 (Epic 2.3 - Rapid Iteration Interface)

## Key Features
1. **Hierarchical Tree Visualization**: Interactive navigation through agent evaluation hierarchy
2. **Constraint Management**: Add, edit, and categorize constraints for each node
3. **Open Coding Integration**: Link failure modes from existing analysis
4. **Metrics Dashboard**: Real-time evaluation statistics and performance tracking

## Testing Instructions
See [PR Documentation](docs/PR_AGENT_EVALUATION.md) for detailed testing steps.

### Quick Test
1. Run `npm run dev` in web-ui directory
2. Navigate to http://localhost:3000/agent-evaluation
3. Interact with the hierarchical tree
4. Add/edit constraints for different nodes
5. Test integration with open coding results

## Review Checklist
- [ ] Code follows TypeScript best practices
- [ ] UI components match existing design system
- [ ] Integration points work seamlessly
- [ ] Performance is acceptable (<3s load time)
- [ ] No regression in existing features

## Screenshots
*Screenshots will be added during testing*

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)" \
  --assignee @me \
  --label "type:feature,priority:high,phase:2-open-coding,epic:2.3-rapid-iteration"

echo -e "\nPR creation complete! The PR URL will be displayed above."