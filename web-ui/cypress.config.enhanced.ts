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
