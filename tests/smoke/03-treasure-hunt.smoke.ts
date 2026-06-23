import { execSync } from 'child_process'
import { beforeAll, describe, expect, it } from 'vitest'
import { YC_TEAM_CHALLENGE_SLUG } from '@/lib/yc/constants'
import { treasureHuntFragmentCode } from '@/lib/yc/treasure-hunt'
import { smokeEnv } from '../helpers/constants'
import { apiJson, expectOk, jsonHeaders } from '../helpers/smoke-api'
import { expectFeatureOpenOrDisabled } from '../helpers/feature-guard'

const t1 = smokeEnv.token1
const t2 = smokeEnv.token2
const slug = YC_TEAM_CHALLENGE_SLUG
const fragment = treasureHuntFragmentCode(1)

function resetSmoke() {
  execSync('npx tsx scripts/smoke-reset.ts', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  })
}

async function registerMinimal() {
  for (const token of [t1, t2] as const) {
    await apiJson(token, '/register', {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({
        name: `[SMOKE] TH ${token}`,
        gender: 'MALE',
        churchName: 'Wilayah II',
        serviceInterest: [],
      }),
    })
  }
  await apiJson(t1, '/group/claim-captain', { method: 'POST' })
}

describe.sequential('YC treasure hunt smoke', () => {
  let teamFeatureOn = true

  beforeAll(async () => {
    resetSmoke()
    await registerMinimal()
    const probe = await apiJson<{ error?: string }>(t1, `/challenges/${slug}/scan`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ qrCode: fragment }),
    })
    if (expectFeatureOpenOrDisabled(probe.res, probe.data, 'Team challenge') === 'disabled') {
      teamFeatureOn = false
    }
  }, 120_000)

  it('scan fragment', async () => {
    if (!teamFeatureOn) return
    const { res, data } = await apiJson<{ fragmentOrder?: number }>(t1, `/challenges/${slug}/scan`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ qrCode: fragment }),
    })
    expect(res.status).toBe(200)
    expect(data.fragmentOrder).toBe(1)
  })

  it('trigger emergency', async () => {
    if (!teamFeatureOn) return
    const { res } = await apiJson(t1, `/challenges/${slug}/emergency/trigger`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ qrCode: fragment }),
    })
    expect(res.status).toBe(200)
  })

  it('both members ready', async () => {
    if (!teamFeatureOn) return
    for (const token of [t1, t2] as const) {
      const { res } = await apiJson(token, `/challenges/${slug}/emergency/ready`, {
        method: 'POST',
      })
      expectOk(res, `ready ${token}`)
      expect(res.status).toBe(200)
    }
  })

  it('status shows all ready', async () => {
    if (!teamFeatureOn) return
    const { res, data } = await apiJson<{ allReady?: boolean; status?: string }>(
      t1,
      `/challenges/${slug}/emergency/status`,
    )
    expectOk(res, 'status')
    expect(data.allReady).toBe(true)
    expect(['EMERGENCY', 'WAITING']).toContain(data.status)
  })

  it('open quiz and vote consensus', async () => {
    if (!teamFeatureOn) return
    const open = await apiJson<{ quizQuestion?: { id: string } }>(
      t1,
      `/challenges/${slug}/emergency/open-quiz`,
      { method: 'POST' },
    )
    expectOk(open.res, 'open quiz')
    expect(open.res.status).toBe(200)

    const questionId = open.data.quizQuestion?.id
    expect(questionId).toBeTruthy()

    for (const token of [t1, t2] as const) {
      const vote = await apiJson(token, `/challenges/${slug}/quiz/vote`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ questionId, selectedAnswer: 'C' }),
      })
      expectOk(vote.res, `vote ${token}`)
      expect(vote.res.status).toBeLessThan(500)
    }

    const after = await apiJson<{ status?: string }>(t1, `/challenges/${slug}/emergency/status`)
    expectOk(after.res, 'after vote')
    expect(['EXPLORING', 'WAITING', 'COMPLETED', 'QUIZ_OPEN', 'FAILED']).toContain(
      after.data.status,
    )
  })
})
