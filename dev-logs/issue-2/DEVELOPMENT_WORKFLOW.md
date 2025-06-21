# Issue #2 Development Workflow

## Quick Start
```bash
# Start development environment
npm run dev:full

# Run all tests
npm run test:all

# Capture screenshots and generate docs
npm run build:docs
```

## Testing Strategy

### Unit Tests (Jest)
- **Location**: `__tests__/` and `*.test.tsx` files
- **Coverage**: Automatically generated in `dev-logs/issue-2/coverage/`
- **Reports**: HTML report in `dev-logs/issue-2/test-results/unit-test-results.html`

### Integration Tests (Cypress)
- **Location**: `cypress/e2e/client-portal.cy.ts`
- **Screenshots**: Automatically captured in `dev-logs/issue-2/screenshots/`
- **Videos**: Recorded in `dev-logs/issue-2/screenshots/videos/`

### Accessibility Tests
- **Automated**: Runs with unit tests using axe-core
- **Manual**: Documented in testing checklist

## Logging
- **Development**: Console + file logging
- **Files**: `dev-logs/issue-2/combined.log` and `dev-logs/issue-2/error.log`
- **Level**: Debug in development, Info in production

## Documentation Capture
- Test results → HTML reports
- Screenshots → Automated during E2E tests
- Coverage → Badge generation
- Logs → Structured JSON format

## PR Requirements
1. All tests passing ✅
2. Coverage >80% ✅
3. Screenshots captured ✅
4. Accessibility validated ✅
5. Logs clean ✅
