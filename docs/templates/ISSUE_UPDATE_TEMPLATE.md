# GitHub Issue Update Template
## Standard Format for Strategic Updates

*Template for updating issues with decision logs and change tracking*

---

## 📝 **Issue Update Format**

### **Standard Header Addition**:
```markdown
---
## 🔄 **DECISION LOG** 
**Last Updated**: 2025-06-18  
**Strategic Context**: Client engagement task architecture  
**Key Changes**: [Brief summary of major changes]  
**Validation Status**: ✅ Tested with DD client | ⏳ Pending validation | ❌ Not validated  
**Impact Level**: 🔴 High | 🟡 Medium | 🟢 Low  

---
```

### **Changelog Section Addition**:
```markdown
---

## **CHANGELOG**

### 2025-06-18 - Strategic Architecture Update
- **Added**: Reusable client engagement task framework
- **Added**: Decision checkpoint integration for client assessment
- **Added**: Terminology worksheet requirement
- **Updated**: Acceptance criteria to include [specific changes]
- **Validation**: Tested with DD client traces and confirmed [results]

### [Previous Date] - [Previous Update]
- **Added**: [Previous additions]
- **Updated**: [Previous updates]
- **Validation**: [Previous validation results]
```

---

## 🎯 **Update Categories**

### **🔴 High Impact Updates (Major Rewrites)**
**Examples**: Issues #1, #8, #17

**Required Changes**:
- Complete rewrite of description and acceptance criteria
- New sub-tasks and dependencies
- Architecture change implications
- Extended validation requirements

**Template Additions**:
```markdown
**⚠️ MAJOR ARCHITECTURE CHANGE**: This issue has been significantly updated to support reusable client engagement tasks rather than generic SDK features.

**Migration Impact**: [Describe impact on existing work]
**Team Alignment**: [Confirm team review and approval]
```

### **🟡 Medium Impact Updates (Significant Additions)**
**Examples**: Issues #2, #4

**Required Changes**:
- Additional requirements and acceptance criteria
- New integration points
- Modified workflows
- Expanded scope

**Template Additions**:
```markdown
**📋 SCOPE EXPANSION**: This issue has been expanded to include [new requirements].

**Integration Points**: [List new dependencies and connections]
```

### **🟢 Low Impact Updates (Standard Additions)**  
**Examples**: Most epic issues (terminology worksheets)

**Required Changes**:
- Standard terminology worksheet requirement
- Minor acceptance criteria additions
- Process improvements

**Template Additions**:
```markdown
**📚 PROCESS ENHANCEMENT**: Added terminology worksheet requirement for client alignment.

**Standard Addition**: All epics now require terminology alignment with client teams.
```

---

## 📋 **Epic-Specific Templates**

### **Epic Issues (12 issues)**
**Standard Addition for All Epics**:
```markdown
### **Terminology Alignment Requirement**
**Added 2025-06-18**: All epics now require terminology worksheet completion.

**New Acceptance Criteria**:
- [ ] Epic-specific terminology worksheet completed
- [ ] Client terminology alignment session conducted
- [ ] Domain vocabulary conflicts resolved and documented
- [ ] Terminology reference guide created for team use

**Process**: 
1. Create terminology worksheet during epic planning
2. Review with client team in synchronous meeting
3. Document domain-specific vocabulary and definitions
4. Maintain terminology reference throughout epic execution
```

### **Client Onboarding Issues**
**Special Template for Issues #1, #2, #3**:
```markdown
### **Client Engagement Task Architecture**
**Updated 2025-06-18**: Converted from generic SDK features to reusable client engagement tasks.

**Key Architectural Changes**:
- **Reusability**: Tasks designed for use across multiple client engagements
- **Tracking**: Client engagement progress tracking and analytics
- **Customization**: Client-specific variations while maintaining core reusability
- **Decision Points**: Integrated client assessment and workflow routing

**Repository Model**: Each client receives private repository clone with custom configuration.

**Success Metrics**: 
- Task reusability across 2+ client engagements
- Reduced client onboarding time by 60%
- Consistent client experience across projects
```

### **Workflow Issues (Analysis Focus)**
**Special Template for Issues #8, #17**:
```markdown
### **Configurable Analysis Workflows**
**Updated 2025-06-18**: Added support for Input vs Output focused analysis paths.

**Decision Framework Integration**:
- **Input Focus**: User understanding, personalization, belief alignment
- **Output Focus**: Error analysis, failure modes, quality improvement  
- **Decision Point**: After terminology training, based on client assessment
- **Flexibility**: Can switch focus during engagement based on learnings

**Client Assessment Criteria**:
- Error rate analysis and client maturity level
- Business priorities and domain requirements
- Technical readiness and infrastructure
- Timeline and resource constraints

**Implementation Requirements**:
- Configurable UI workflows for both analysis approaches
- Decision checkpoint system integration
- Analytics and progress tracking for chosen path
- Migration support for switching approaches mid-engagement
```

---

## ✅ **Validation Checklist**

### **Before Updating Issues**:
- [ ] Decision framework tested with DD client data
- [ ] Architectural changes validated with team
- [ ] Impact assessment completed for affected issues
- [ ] Regression risk evaluated and mitigated

### **During Updates**:
- [ ] Decision log header added with current date
- [ ] Changelog section updated with specific changes
- [ ] Validation status marked appropriately
- [ ] Cross-references updated for dependent issues

### **After Updates**:
- [ ] Team notification of changes sent
- [ ] Dependent issues updated with new requirements
- [ ] Project board status updated if needed
- [ ] Documentation links verified and updated

---

## 🔄 **Rollback Plan**

### **If Updates Cause Issues**:
1. **Immediate**: Mark validation status as ❌ Not validated
2. **Document**: Record specific problems in decision log
3. **Revert**: Use GitHub issue edit history to restore previous version
4. **Communicate**: Notify team of rollback and reasons
5. **Reassess**: Revise strategic approach based on learnings

### **Version Control**:
- GitHub automatically tracks issue edit history
- Decision log provides human-readable change summary
- Changelog maintains detailed change records
- Validation status tracks testing progress

This template ensures consistent, trackable updates while maintaining team alignment and providing rollback capabilities.