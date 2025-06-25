# Implementation Plan Analysis: Legacy vs New vs GitHub Issues

## Executive Summary

We have **two conflicting implementation plans** and a GitHub issue structure that needs reconciliation:

1. **Legacy Plan** (`IMPLEMENTATION_PLAN.md`): 6-phase client-focused approach with detailed UX mockups
2. **New Plan** (`docs/implementation_plan.md`): Memory×Provenance×Self-Model roadmap with 6-phase customer journey
3. **GitHub Issues**: 4 epics (L1-L4) spanning 6 phases with 16 sub-issues

## Customer Journey Comparison

### Legacy Plan (6 Phases)
| Phase | Focus | Timeline | Key UI Components |
|-------|-------|----------|-------------------|
| **Phase 1**: Core Evaluation Loop & Foundation | Immediate evaluation + audit | 4-5 weeks | Trace upload, project dashboard |
| **Phase 2**: Open Coding & Analysis Platform | Collaborative labeling | 4-5 weeks | Open coding workspace, rubric builder |
| **Phase 3**: Failure Mode Analysis & Taxonomy | Systematic failure analysis | 3-4 weeks | Failure taxonomy, pattern detection |
| **Phase 4**: Evaluation System Implementation | Automated LLM judges | 5-6 weeks | Judge training, calibration tools |
| **Phase 5**: Personalization Implementation | Epistemic Me integration | 6-7 weeks | Self-model UI, belief tracking |
| **Phase 6**: Advanced Analytics & Monitoring | Value demonstration | 3-4 weeks | Executive dashboards, ROI metrics |

### New Plan (6 Customer Journey Phases)
| Phase | Roadmap Hook | Deliverables | L-Level Mapping |
|-------|--------------|--------------|-----------------|
| **Initial Audit** | "We'll find your AI's failure modes" | Trace analysis, failure taxonomy | L0-L1 foundation |
| **Terminology Training** | "We'll teach judges to speak your language" | Custom rubrics, calibrated judges | L1 enhancement |
| **Open Coding** | "We'll systematize human insight" | Labeled dataset, insight patterns | L1-L2 bridge |
| **Judge Training** | "We'll scale your evaluation" | Trained LLM judges, evaluation API | L2-L3 bridge |
| **Production Monitoring** | "We'll catch regressions before users" | Real-time dashboards, alert system | L3-L4 bridge |
| **Post-Implementation** | "We'll prove ROI with data" | Performance reports, ROI metrics | L4 maturation |

### GitHub Issues (4 Epics across 6 Phases)
| Epic | L-Level | Phase Assignment | Sub-Issues | Status |
|------|---------|------------------|------------|--------|
| **Epic 2.3**: Working Memory (WM) | L1 | Phase 2 | #73-76 | 4 features |
| **Epic 3.3**: Provenance Manager (PM) | L2 | Phase 3 | #77-80 | 4 features |
| **Epic 5.3**: Self-Model (SM) | L3 | Phase 5 | #81-84 | 4 features |
| **Epic 6.3**: Epistemic Model (EM) | L4 | Phase 6 | #85-88 | 4 features |

## Key Conflicts & Gaps

### 1. **Phase Mapping Mismatch**
- **Legacy**: Phase 1 = Foundation, Phase 2 = Open Coding
- **New**: Initial Audit = L0-L1, Terminology Training = L1
- **GitHub**: Phase 2 = Working Memory (L1), Phase 3 = Provenance (L2)

### 2. **Missing GitHub Coverage**
- **Phase 1**: No epic assigned (should be foundation/audit)
- **Phase 4**: No epic assigned (should be evaluation system)
- **Epics 1.X and 4.X**: Missing from current GitHub structure

### 3. **Technical Architecture Divergence**
- **Legacy**: Client project management, collaborative UI focus
- **New**: Memory×Provenance×Self-Model stack
- **GitHub**: L1-L4 systematic layering but missing L0 foundation

### 4. **Customer Journey Alignment**
Both plans have 6 phases but different focal points:
- **Legacy**: More detailed UI/UX specifications
- **New**: More conceptual roadmap with clear value propositions
- **GitHub**: Technical implementation focused

## Recommended Reconciliation Strategy

### 1. **Unified Phase Structure**
Merge both customer journeys into comprehensive 6-phase approach:

| Phase | Legacy Name | New Hook | Technical Focus | UI Focus |
|-------|-------------|----------|-----------------|----------|
| **1** | Foundation | Initial Audit | L0 I/O + Infrastructure | Trace upload, project setup |
| **2** | Open Coding | Terminology + Open Coding | L1 Working Memory | Collaborative labeling UI |
| **3** | Failure Analysis | Judge Training (part 1) | L2 Provenance | Failure taxonomy tools |
| **4** | Evaluation System | Judge Training (part 2) | L1-L2 Integration | Automated evaluation |
| **5** | Personalization | Production Monitoring | L3 Self-Model | Belief tracking UI |
| **6** | Analytics | Post-Implementation | L4 Epistemic Model | ROI dashboards |

### 2. **Missing GitHub Epics to Create**
- **Epic 1.X**: Foundation & Audit Infrastructure (Phase 1)
- **Epic 4.X**: Evaluation System Implementation (Phase 4)

### 3. **Technical Architecture Consistency**
- Adopt **Memory×Provenance×Self-Model** as core thesis
- Maintain **L0-L4 evaluation levels** as technical framework
- Integrate **client project management** from legacy plan
- Preserve **detailed UI/UX specifications** from legacy plan

### 4. **Customer Journey Enhancement**
The new plan should **add to** the customer journey by:
- **Conceptual Framework**: Memory×Provenance×Self-Model bridge
- **Value Propositions**: Clear "we'll do X for you" hooks
- **Technical Depth**: L0-L4 evaluation sophistication
- **Metric Targets**: Specific performance benchmarks

But **preserve** from legacy plan:
- **Detailed UI Mockups**: Critical for development execution
- **Technical Implementation**: Database schemas, API endpoints
- **Client Management**: Project setup, user onboarding workflows
- **Timeline Estimates**: Realistic 4-7 week phase durations

## Next Steps

1. **Create Unified Implementation Plan** that merges:
   - New plan's conceptual framework and value propositions
   - Legacy plan's detailed UI/UX specifications and technical implementation
   - GitHub issues' systematic L1-L4 architecture

2. **Add Missing GitHub Epics**:
   - Epic 1.X for Phase 1 (Foundation)
   - Epic 4.X for Phase 4 (Evaluation System)

3. **Reconcile Phase Assignments**:
   - Align GitHub epic phases with unified customer journey
   - Ensure proper L0-L4 progression across all 6 phases

4. **Replace Root Implementation Plan**:
   - Move legacy `IMPLEMENTATION_PLAN.md` to archive
   - Replace with unified plan as authoritative version
   - Remove duplicate `docs/implementation_plan.md`

This reconciliation will ensure the implementation plan, GitHub issues, and customer journey are all aligned and mutually reinforcing.