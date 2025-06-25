# GitHub PR Template

## Constraint Compliance Checklist
- [ ] Regression tests included and passing
- [ ] Screenshots of working implementation attached
- [ ] Testing instructions provided
- [ ] Review completable in <30 minutes
- [ ] Review checklist with acceptable/unacceptable states

---

## Summary
[Brief description of what this PR implements]

**Resolves**: #[issue-number]

## Implementation Overview
**Developer Role**: [What the human developer did]
**Claude Code Role**: [What Claude Code implemented]

## Screenshots
### Before
[Screenshot or N/A]

### After  
[Screenshot of working implementation]

## Testing Instructions
For reviewers to validate in <30 minutes:

1. **Setup**: [Required environment/dependencies]
2. **Test Scenario 1**: [Step-by-step user actions and expected results]
3. **Test Scenario 2**: [Step-by-step validation and expected results]
4. **Regression Verification**: [How to verify existing functionality still works]

## Regression Tests
- [ ] **New Tests Added**:
  - [Test description 1]
  - [Test description 2]
- [ ] **Existing Tests**: All passing ✅

## Review Checklist
Each item has clearly defined acceptable ✅ vs unacceptable ❌ states:

### Functionality
- [ ] **Core Feature**
  - ✅ [Specific working behavior observed]
  - ❌ [Specific failure condition that blocks merge]

- [ ] **User Experience**  
  - ✅ [Specific UX standard met]
  - ❌ [Specific UX failure that blocks merge]

### Code Quality
- [ ] **Implementation**
  - ✅ [Specific code quality standard]
  - ❌ [Specific quality issue that blocks merge]

- [ ] **Testing Coverage**
  - ✅ [Specific test coverage achieved]
  - ❌ [Specific test gap that blocks merge]

### Integration
- [ ] **No Breaking Changes**
  - ✅ [All existing functionality verified working]
  - ❌ [Existing functionality broken]

## External Dependencies Status
- [ ] [Dependency 1]: [Status - completed/pending/blocked]
- [ ] [Dependency 2]: [Status - completed/pending/blocked]

## Post-Merge Actions
- [ ] [Action 1 - who/when]
- [ ] [Action 2 - who/when]

---
**Review Time**: This PR should be reviewable in <30 minutes following the testing instructions above.