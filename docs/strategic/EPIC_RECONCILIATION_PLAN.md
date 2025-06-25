# Epic Reconciliation Plan for Memory×Provenance×Self-Model Roadmap

## Current State Analysis

### Existing Epic Structure
- **Phase 1**: Foundation (1.1, 1.2, 1.3, 1.4)
- **Phase 2**: Open Coding (2.1, 2.2)
- **Phase 3**: Failure Analysis (3.1, 3.2)
- **Phase 4**: Evaluation System (4.1, 4.2)
- **Phase 5**: Personalization (5.1, 5.2)
- **Phase 6**: Production (6.1, 6.2)

### New Roadmap Epics (Need Proper Numbering)
- Working Memory (WM) - Currently using 3.1 (conflicts!)
- Provenance Manager (PM) - Currently using 4.1 (conflicts!)
- Self-Model (SM) - Currently using 5.1 (conflicts!)
- Epistemic Model (EM) - Currently using 6.1 (conflicts!)

## Proposed Reconciliation

### Option 1: Integrate into Existing Structure
Map the new components to align with existing phases:
- **Phase 2**: Add Working Memory as [EPIC 2.3]
- **Phase 3**: Add Provenance Manager as [EPIC 3.3]
- **Phase 4**: Keep existing Judge Training, add Memory/Provenance features
- **Phase 5**: Merge Self-Model with existing 5.1
- **Phase 6**: Add Epistemic Model as [EPIC 6.3]

### Option 2: Create New Phase Structure (Recommended)
Reorganize phases to align with L0-L4 progression:
- **Phase 1**: Foundation & L0 I/O (weeks 1-2)
- **Phase 2**: L1 Working Memory & Tool Use (weeks 3-4)
- **Phase 3**: L2 Provenance & Multi-turn (weeks 5-6)
- **Phase 4**: L3 Self-Model & Adaptation (weeks 7-8)
- **Phase 5**: L4 Epistemic Model & Personalization (weeks 9-10)
- **Phase 6**: Production & Optimization (weeks 11-12)

## Implementation Steps

### 1. Update New Epics (#69, #70, #71, #72)
```bash
# Working Memory - Change to [EPIC 2.3]
gh issue edit 69 --title "[EPIC 2.3] Working Memory (WM) - L1 Agent with Tool Use"
gh issue edit 69 --remove-label "epic:3.1-working-memory" --add-label "epic:2.3-working-memory"
gh issue edit 69 --remove-label "phase:3-failure-analysis" --add-label "phase:2-open-coding"

# Provenance Manager - Change to [EPIC 3.3]
gh issue edit 70 --title "[EPIC 3.3] Provenance Manager (PM) - L2 Multi-turn Dialogue"
gh issue edit 70 --remove-label "epic:4.1-provenance-manager" --add-label "epic:3.3-provenance-manager"
gh issue edit 70 --remove-label "phase:4-evaluation-system" --add-label "phase:3-failure-analysis"

# Self-Model - Merge with existing 5.1 or create 5.3
gh issue edit 71 --title "[EPIC 5.3] Self-Model (SM) - L3 Adaptive Agent"
gh issue edit 71 --remove-label "epic:5.1-self-model" --add-label "epic:5.3-self-model"

# Epistemic Model - Change to [EPIC 6.3]
gh issue edit 72 --title "[EPIC 6.3] Epistemic Model (EM) - L4 Personalized Recommendation"
gh issue edit 72 --remove-label "epic:6.1-epistemic-model" --add-label "epic:6.3-epistemic-model"
```

### 2. Create Sub-Issues for Each New Epic

#### [EPIC 2.3] Working Memory Sub-Issues
1. **Memory Store Implementation** - Redis-based session storage
2. **Context Retrieval API** - Fast retrieval for tool use
3. **Tool Use Tracking** - Monitor and log agent tool interactions
4. **Memory Cleanup Service** - Expire old sessions

#### [EPIC 3.3] Provenance Manager Sub-Issues
1. **Decision Lineage Tracker** - Track all decision points
2. **Source Attribution System** - Link outputs to inputs
3. **Audit Trail Generator** - Create compliance reports
4. **Multi-turn Context Manager** - Maintain conversation state

#### [EPIC 5.3] Self-Model Sub-Issues
1. **Belief Extraction Pipeline** - Extract beliefs from conversations
2. **Preference Learning Engine** - Learn user preferences
3. **Epistemic Context Builder** - Build user mental models
4. **Adaptation Framework** - Modify behavior based on self-model

#### [EPIC 6.3] Epistemic Model Sub-Issues
1. **Recommendation Engine** - Generate personalized recommendations
2. **A/B Testing Framework** - Test recommendation effectiveness
3. **Belief Alignment Validator** - Ensure recommendations align
4. **Performance Analytics** - Track recommendation success

### 3. Update Milestones
- Create new milestones if using Option 2
- Or assign to existing phase milestones if using Option 1

### 4. Re-link Existing Features
- Move Open Coding Interface (#67) to [EPIC 2.3] Working Memory
- Keep personalization features (#34, #35, #36) with [EPIC 5.3] Self-Model
- Review all phase 3-6 features for proper epic assignment

## Timeline
- **Today**: Update epic titles and labels
- **Tomorrow**: Create all sub-issues
- **Day 3**: Update milestones and re-link features
- **Day 4**: Update project board views
- **Day 5**: Team review and finalization

## Success Criteria
- [ ] All epics follow [EPIC X.Y] naming convention
- [ ] No conflicting epic numbers
- [ ] Each epic has 3-5 sub-issues
- [ ] All epics assigned to correct milestones
- [ ] Project board shows clear progression L0→L4
- [ ] No orphaned features