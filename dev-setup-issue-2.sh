#!/bin/bash

# Development Environment Setup for Issue #2
# Client Portal Landing Page with Progress Tracking

echo "🚀 Setting up development environment for Issue #2..."

# Create directories for logging and test captures
mkdir -p dev-logs/issue-2
mkdir -p dev-logs/issue-2/screenshots
mkdir -p dev-logs/issue-2/test-results
mkdir -p dev-logs/issue-2/coverage

cd web-ui

# Install additional development dependencies for comprehensive testing and logging
echo "📦 Installing enhanced development dependencies..."

npm install --save-dev \
  @types/jest \
  jest-html-reporter \
  jest-coverage-badges \
  puppeteer \
  @axe-core/playwright \
  lighthouse-ci \
  winston \
  npm-run-all \
  concurrently \
  http-server

# Add development scripts to package.json for comprehensive testing and documentation
echo "⚙️ Updating package.json with enhanced scripts..."

# Backup original package.json
cp package.json package.json.backup

# Create enhanced package.json with new scripts
cat package.json.backup | jq '.scripts += {
  "dev:full": "concurrently \"npm run dev\" \"npm run dev:api\"",
  "dev:api": "cd ../profile-mcp && python -m app.main",
  "test:unit": "jest --coverage --coverageDirectory=../dev-logs/issue-2/coverage",
  "test:integration": "jest --testPathPattern=integration",
  "test:e2e": "cypress run --browser chrome --reporter json --reporter-options output=../dev-logs/issue-2/test-results/cypress-results.json",
  "test:e2e:headed": "cypress open",
  "test:lighthouse": "lhci autorun",
  "test:accessibility": "jest --testPathPattern=accessibility",
  "test:all": "npm-run-all test:unit test:integration test:e2e",
  "capture:screenshots": "cypress run --browser chrome --spec \"cypress/e2e/client-portal.cy.ts\"",
  "build:docs": "npm run test:unit && npm run capture:screenshots",
  "precommit": "npm run lint && npm run test:unit"
}' > package.json.new && mv package.json.new package.json

echo "📝 Creating comprehensive test configuration..."

# Create enhanced Jest configuration
cat > jest.config.enhanced.js << 'EOF'
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageReporters: ['text', 'html', 'json-summary', 'lcov'],
  coverageDirectory: '../dev-logs/issue-2/coverage',
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Issue #2 Test Results',
      outputPath: '../dev-logs/issue-2/test-results/unit-test-results.html',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }]
  ],
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/?(*.)+(spec|test).{ts,tsx}'
  ]
}

module.exports = createJestConfig(customJestConfig)
EOF

# Create Cypress configuration for comprehensive E2E testing
cat > cypress.config.enhanced.ts << 'EOF'
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    videosFolder: '../dev-logs/issue-2/screenshots/videos',
    screenshotsFolder: '../dev-logs/issue-2/screenshots',
    setupNodeEvents(on, config) {
      // Capture console logs
      on('task', {
        log(message) {
          console.log(message)
          return null
        }
      })
    },
    env: {
      coverage: true
    }
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
})
EOF

# Create logging configuration
cat > src/lib/logger.ts << 'EOF'
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'client-portal' },
  transports: [
    new winston.transports.File({ 
      filename: '../dev-logs/issue-2/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: '../dev-logs/issue-2/combined.log' 
    }),
  ],
});

if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
EOF

# Create accessibility testing configuration
cat > accessibility.config.js << 'EOF'
module.exports = {
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'screen-reader': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'best-practice']
};
EOF

# Create test data fixtures for Issue #2
mkdir -p cypress/fixtures/issue-2
cat > cypress/fixtures/issue-2/client-portal-data.json << 'EOF'
{
  "testUser": {
    "id": "dev-test-user",
    "name": "Development Tester",
    "role": "Developer",
    "email": "dev@test.com"
  },
  "projectData": {
    "id": "test-project-1",
    "name": "Test Client Engagement",
    "phase": 1,
    "progress": 25,
    "milestones": [
      { "id": "1.1", "name": "Client Onboarding", "completed": true },
      { "id": "1.2", "name": "Authentication Setup", "completed": false }
    ]
  },
  "stakeholders": [
    { "id": "sme-1", "name": "SME Expert", "role": "SME", "status": "active" },
    { "id": "dev-1", "name": "Developer Lead", "role": "Developer", "status": "active" },
    { "id": "analyst-1", "name": "Data Analyst", "role": "Analyst", "status": "pending" }
  ]
}
EOF

echo "🔧 Setting up environment variables..."

# Create development environment file if it doesn't exist
if [ ! -f .env.local ]; then
  cp env.example .env.local
  echo "NEXT_PUBLIC_API_URL=http://localhost:8010" >> .env.local
  echo "NEXT_PUBLIC_LOG_LEVEL=debug" >> .env.local
  echo "CYPRESS_RECORD_KEY=" >> .env.local
fi

echo "📋 Creating development workflow documentation..."

cat > ../dev-logs/issue-2/DEVELOPMENT_WORKFLOW.md << 'EOF'
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
EOF

echo "✨ Development environment setup complete!"
echo ""
echo "📁 Directory structure created:"
echo "  dev-logs/issue-2/              # All logs and results"
echo "  dev-logs/issue-2/screenshots/  # Cypress screenshots & videos"
echo "  dev-logs/issue-2/test-results/ # Test reports"
echo "  dev-logs/issue-2/coverage/     # Code coverage"
echo ""
echo "🚀 Next steps:"
echo "  1. cd web-ui"
echo "  2. npm install"
echo "  3. npm run dev:full"
echo "  4. Open http://localhost:3000"
echo ""
echo "📖 See dev-logs/issue-2/DEVELOPMENT_WORKFLOW.md for complete workflow"