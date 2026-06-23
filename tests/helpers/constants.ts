export const SMOKE_PREFIX = '[SMOKE]'

export const SMOKE_PARTICIPANT_IDS = [
  'smoke-test-id-1',
  'smoke-test-id-2',
  'smoke-test-id-3',
  'smoke-test-id-4',
] as const

export const SMOKE_GROUP_IDS = ['team-smoke', 'team-smoke-b'] as const

const DEFAULT_BASE_URL = 'https://www.gpdiwilayahdua.web.id'

export function getSmokeEnv() {
  const raw = process.env.BASE_URL?.trim()
  return {
    baseUrl: raw || DEFAULT_BASE_URL,
    token1: process.env.SMOKE_TOKEN_1 || 'test-smoke-1',
    token2: process.env.SMOKE_TOKEN_2 || 'test-smoke-2',
    token3: process.env.SMOKE_TOKEN_3 || 'test-smoke-3',
    token4: process.env.SMOKE_TOKEN_4 || 'test-smoke-4',
    groupA: process.env.SMOKE_GROUP_A || 'team-smoke',
    groupB: process.env.SMOKE_GROUP_B || 'team-smoke-b',
    adminPassword: process.env.YC_ADMIN_PASSWORD || '',
  }
}

/** @deprecated use getSmokeEnv() — lazy read avoids vitest import order issues */
export const smokeEnv = new Proxy({} as ReturnType<typeof getSmokeEnv>, {
  get(_target, prop: string) {
    return getSmokeEnv()[prop as keyof ReturnType<typeof getSmokeEnv>]
  },
})
