import path from 'path'
import { config as loadDotenv } from 'dotenv'
import { defineConfig } from 'vitest/config'

loadDotenv({ path: path.resolve(__dirname, '.env.test') })
loadDotenv({ path: path.resolve(__dirname, '.env') })
loadDotenv({ path: path.resolve(__dirname, '.env.local') })

const defaultBaseUrl = 'https://www.gpdiwilayahdua.web.id'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/smoke/**/*.smoke.ts'],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    sequence: { concurrent: false },
    fileParallelism: false,
    env: {
      BASE_URL: process.env.BASE_URL || defaultBaseUrl,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
