import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { config as loadDotenv } from 'dotenv'

loadDotenv({ path: path.resolve(__dirname, '.env.test') })
loadDotenv({ path: path.resolve(__dirname, '.env') })

const baseURL = process.env.BASE_URL || 'https://www.gpdiwilayahdua.web.id'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  globalSetup: path.resolve(__dirname, 'tests/e2e/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, 'tests/e2e/global-teardown.ts'),
})
