import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: process.env.PLAYWRIGHT_BASE_URL ? 180000 : 30000,
  // Public hosting may be slower than the local fixture, especially on a cold CDN.
  expect: { timeout: process.env.PLAYWRIGHT_BASE_URL ? 60000 : 10000 },
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:8766/supplychain/',
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 960 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run preview -- --port 8766 --strictPort --base=/supplychain/',
    url: 'http://127.0.0.1:8766/supplychain/',
    reuseExistingServer: false,
    timeout: 30000,
  },
})
