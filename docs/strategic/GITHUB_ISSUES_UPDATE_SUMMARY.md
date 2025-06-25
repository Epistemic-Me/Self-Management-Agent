# GitHub Issues Update Summary
## Required Changes Based on Strategic Decisions Analysis

*Generated from team comments analysis on 2025-06-18*

---

## 🎯 Issues Requiring Major Updates

### **Issue #1: [EPIC 1.1] Client Onboarding & Project Management System**
**Status**: Requires significant architectural changes

#### **Required Updates**:
- **Title**: Add "Reusable Task Framework" to title
- **Description**: Complete rewrite to focus on client engagement tasks vs SDK features
- **Acceptance Criteria**: Add client assessment framework requirements
- **New Requirements**:
  - Client decision framework system (Input vs Output focus)
  - Terminology worksheet template for every epic
  - Reusable task template architecture
  - Decision checkpoint documentation system

#### **Comments to Address**:
- ✅ jonmc12: "re-build these so that they are re-usable tasks"
- ✅ therobertta: "decision point internally for the Epistemic Me team after Terminology Training"
- ✅ jonmc12: "Terminology worksheet for every epic"

---

### **Issue #2: [FEATURE] Client Portal Landing Page with Progress Tracking**
**Status**: Requires modification with decision gates

#### **Required Updates**:
- **Description**: Add personalization metrics decision gate after Step 4 (Terminology Training)
- **UI Mockup**: Update progress steps to include decision checkpoint
- **Acceptance Criteria**: Add decision framework integration
- **New Step**: "4b. Analysis Focus Decision (Input vs Output)"

#### **Comments to Address**:
- ✅ jonmc12: Real traces available (AI Bryan traces.csv)
- ✅ therobertta: Decision point for Personalization Metrics timing

#### **New Progress Flow**:
```
1. Account Creation & Team Access
2. Project Repository Setup  
3. Initial Trace Collection
4. Terminology Training
4b. 🔄 DECISION GATE: Analysis Focus (Input vs Output)
5. Personalization Metrics Assessment (conditional)
6. Kickoff Call Scheduling
```

---

### **Issue #4: [EPIC 1.2] Enhanced Authentication & Access Control System**
**Status**: Requires security architecture review

#### **Required Updates**:
- **Description**: Add MCP server best practices review requirement
- **Acceptance Criteria**: Add DD MCP compliance verification
- **New Task**: "Security Architecture Review Against DD MCP Patterns"
- **Implementation Notes**: Reference DD MCP as security baseline

#### **Comments to Address**:
- ✅ jonmc12: "This needs to be reviewed against the MCP server example (DD MCP)"

---

### **Issue #8: [EPIC 2.1] Open Coding Application**
**Status**: Requires fundamental workflow changes

#### **Required Updates**:
- **Title**: Add "with Configurable Analysis Paths"
- **Description**: Complete rewrite to support Input vs Output focus decision
- **Prerequisites**: Add client assessment decision requirement
- **Acceptance Criteria**: Add workflow routing capabilities
- **New Features**:
  - Configurable analysis workflows
  - Input-focused vs Output-focused interface modes
  - Decision framework integration

#### **Comments to Address**:
- ✅ jonmc12: "Pre-requisite to give the client a decision about whether we should focus on user understanding (inputs) or error analysis (outputs) first"

---

### **Issue #17: [EPIC 3.1] Failure Analysis Workbench**
**Status**: Requires integration capabilities

#### **Required Updates**:
- **Description**: Add tool interoperability requirements
- **Acceptance Criteria**: Add import/export functionality
- **New Epic Sub-task**: "Tool Integration Research & Specification"
- **Integration Requirements**:
  - CSV/JSON export compatibility
  - Common AI eval tool format support
  - Import functionality for external datasets

#### **Comments to Address**:
- ✅ jonmc12: "Ideally these tools have an import/export that would work alongside other AI eval tools"

---

## 📋 Issues Requiring Minor Updates

### **All Epic Issues (#1, #8, #13, #17, #21, #25, #29, #33, #37, #41, #45)**
**Status**: Add terminology worksheet requirement

#### **Standard Addition to All Epics**:
- **New Acceptance Criteria**: "Terminology worksheet completed and reviewed"
- **New Sub-task**: "Create epic-specific terminology definitions"
- **Process Requirement**: "Client terminology alignment verification"

---

## 🆕 New Issues to Create

### **New Issue A: Client Assessment Framework**
**Epic**: 1.1 | **Labels**: phase:1-foundation, priority:high, component:frontend

#### **Description**:
Create systematic framework for assessing client needs and determining optimal analysis approach (Input vs Output focus).

#### **Acceptance Criteria**:
- [ ] Client assessment questionnaire system
- [ ] Decision criteria framework for Input vs Output focus
- [ ] Personalization readiness assessment
- [ ] Documentation templates for decision rationale

---

### **New Issue B: Tool Integration Research**
**Epic**: 3.1 | **Labels**: phase:3-failure-analysis, priority:medium, component:backend

#### **Description**:
Research common AI evaluation tools in client ecosystems and specify integration requirements.

#### **Acceptance Criteria**:
- [ ] Survey of 10+ common AI eval tools
- [ ] Standard data format specifications
- [ ] Import/export API design
- [ ] Integration tier recommendations (Basic/API/Native)

---

### **New Issue C: MCP Security Best Practices Review**
**Epic**: 1.2 | **Labels**: phase:1-foundation, priority:high, component:backend

#### **Description**:
Review DD MCP implementation and extract security patterns for authentication system.

#### **Acceptance Criteria**:
- [ ] DD MCP security analysis completed
- [ ] Security pattern documentation
- [ ] Gap analysis vs current Issue #4 requirements
- [ ] Updated security specifications

---

### **New Issue D: Terminology Worksheet System**
**Epic**: 1.1 | **Labels**: phase:1-foundation, priority:medium, component:frontend

#### **Description**:
Create system for managing epic-specific terminology and client alignment.

#### **Acceptance Criteria**:
- [ ] Terminology worksheet template
- [ ] Epic-specific term capture interface
- [ ] Client review and approval workflow
- [ ] Terminology conflict resolution process

---

## 🔄 Architecture Impact Analysis

### **Issues Requiring Architectural Changes**:

| Issue | Impact Level | Change Type | Estimated Effort |
|-------|-------------|-------------|------------------|
| #1 | 🔴 High | Complete rewrite | 3-5 days |
| #2 | 🟡 Medium | Add decision gates | 1-2 days |
| #8 | 🔴 High | Workflow routing | 2-3 days |
| #17 | 🟡 Medium | Add integrations | 2-3 days |
| #4 | 🟡 Medium | Security review | 1-2 days |

### **Cross-Epic Dependencies**:
- **Issue #1** → All other issues (task framework affects everything)
- **Issue #2** → **Issue #8** (decision gate feeds workflow routing)
- **New Issue A** → **Issues #2, #8** (assessment framework integration)
- **New Issue C** → **Issue #4** (security patterns inform auth system)

---

## 📊 Implementation Priority

### **Phase 1 (Immediate)**:
1. Update Issue #1 with reusable task architecture
2. Create New Issue A (Client Assessment Framework)
3. Create New Issue C (MCP Security Review)
4. Update Issue #4 with security requirements

### **Phase 2 (After Architecture Approval)**:
5. Update Issue #2 with decision gates
6. Update Issue #8 with workflow routing
7. Create New Issue D (Terminology System)

### **Phase 3 (Integration Planning)**:
8. Update Issue #17 with integration requirements
9. Create New Issue B (Tool Integration Research)
10. Add terminology requirements to all Epic issues

---

## 💡 Summary

**Total Issues Affected**: 48 (all existing issues + 4 new issues)
**Major Rewrites Required**: 3 issues (#1, #8, #17)
**New Issues to Create**: 4 issues
**Cross-Epic Process Changes**: Terminology worksheets for all 12 epics

The strategic decisions represent a fundamental shift from generic platform features to client-specific, reusable engagement workflows. This requires significant updates to the project structure but will provide much higher client value and reusability.