import { execSync } from 'child_process'
import { beforeAll, describe, expect, it } from 'vitest'
import { YC_TEAM_CHALLENGE_SLUG } from '@/lib/yc/constants'
import { treasureHuntFragmentCode } from '@/lib/yc/treasure-hunt'
import { smokeEnv } from '../helpers/constants'
import { expectFeatureOpenOrDisabled } from '../helpers/feature-guard'
import { apiJson, expectOk, jsonHeaders } from '../helpers/smoke-api'

const t1 = smokeEnv.token1
const t3 = smokeEnv.token3
const slug = YC_TEAM_CHALLENGE_SLUG
const fragment = treasureHuntFragmentCode(1)

function resetSmoke() {
  execSync('npx tsx scripts/smoke-reset.ts', { cwd: process.cwd(), stdio: 'inherit', env: process.env })
}

describe.sequential('YC group isolation smoke', () => {
  beforeAll(async () => {
    resetSmoke()
    for (const token of [t1, t3] as const) {
      await apiJson(token, '/register', {
        method: 'PATCH',
        headers: jsonHeaders(),
        body: JSON.stringify({
          name: `[SMOKE] ISO ${token}`,
          gender: 'FEMALE',
          churchName: 'Wilayah II',
          serviceInterest: [],
        }),
      })
    }
    await apiJson(t1, '/group/claim-captain', { method: 'POST' })
    await apiJson(t3, '/group/claim-captain', { method: 'POST' })
  }, 120_000)

  it('team A emergency does not activate team B polling', async () => {
    const trigger = await apiJson<{ error?: string }>(t1, `/challenges/${slug}/emergency/trigger`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ qrCode: fragment }),
    })
    if (expectFeatureOpenOrDisabled(trigger.res, trigger.data, 'Team challenge') === 'disabled') {
      return
    }
    expect(trigger.res.status).toBe(200)

    const teamB = await apiJson<{ active?: boolean }>(t3, '/emergency/active')
    expectOk(teamB.res, 'team B poll')
    expect(teamB.data.active).toBe(false)
  })
})
