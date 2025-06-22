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
