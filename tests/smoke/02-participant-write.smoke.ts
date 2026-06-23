import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import path from 'path'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  YC_SIPALING_EXTROVERT_SLUG,
  YC_TUKANG_NGONTEN_SLUG,
} from '@/lib/yc/constants'
import { SMOKE_PREFIX, getSmokeEnv, smokeEnv } from '../helpers/constants'
import { apiJson, expectOk, jsonHeaders } from '../helpers/smoke-api'
import { expectFeatureOpenOrDisabled } from '../helpers/feature-guard'

const t1 = smokeEnv.token1
const t2 = smokeEnv.token2

function resetSmoke() {
  execSync('npx tsx scripts/smoke-reset.ts', {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  })
}

const storyText = `${SMOKE_PREFIX} Cerita smoke test minimal lima puluh karakter untuk extrovert.`

describe.sequential('YC participant write smoke', () => {
  beforeAll(() => {
    resetSmoke()
  }, 120_000)

  it('register both participants', async () => {
    for (const [token, label] of [
      [t1, 'User 1'],
      [t2, 'User 2'],
    ] as const) {
      const { res } = await apiJson(token, '/register', {
        method: 'PATCH',
        headers: jsonHeaders(),
        body: JSON.stringify({
          name: `${SMOKE_PREFIX} ${label}`,
          gender: 'MALE',
          churchName: 'Wilayah II',
          instagram: null,
          tiktok: null,
          serviceInterest: [],
        }),
      })
      expectOk(res, 'register')
      expect(res.status).toBe(200)
    }
  })

  it('claim captain and content creator', async () => {
    const cap = await apiJson(t1, '/group/claim-captain', { method: 'POST' })
    expectOk(cap.res, 'captain')
    const cc = await apiJson(t2, '/group/claim-content-creator', { method: 'POST' })
    expectOk(cc.res, 'content-creator')
  })

  it('rename group', async () => {
    const { res } = await apiJson(t1, '/group/name', {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ name: `${SMOKE_PREFIX} Tim A` }),
    })
    expectOk(res, 'rename')
    expect(res.status).toBe(200)
  })

  it('form submit then 409 on repeat', async () => {
    const first = await apiJson<{ error?: string }>(t1, '/form/submit', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ answer: `${SMOKE_PREFIX} form answer` }),
    })
    const gate = expectFeatureOpenOrDisabled(first.res, first.data, 'Worship form')
    if (gate === 'disabled') return

    expect(first.res.status).toBe(200)

    const second = await apiJson(t1, '/form/submit', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ answer: `${SMOKE_PREFIX} form again` }),
    })
    expect(second.res.status).toBe(409)
  })

  it('tukang ngonten submit', async () => {
    const { res } = await apiJson(t1, `/challenges/${YC_TUKANG_NGONTEN_SLUG}/submit`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ answerText: `${SMOKE_PREFIX} ngonten` }),
    })
    expectOk(res, 'ngonten')
    expect(res.status).toBe(200)
  })

  it('extrovert scan and submit stories', async () => {
    const scan = await apiJson(t1, `/challenges/${YC_SIPALING_EXTROVERT_SLUG}/nametag/scan`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ text: t2 }),
    })
    expectOk(scan.res, 'scan')
    expect(scan.res.status).toBe(200)

    for (const token of [t1, t2] as const) {
      const { res } = await apiJson(token, `/challenges/${YC_SIPALING_EXTROVERT_SLUG}/nametag/submit`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ storyText }),
      })
      expectOk(res, `story ${token}`)
      expect(res.status).toBe(200)
    }
  })

  it('documentation personal upload', async () => {
    await uploadFixture(t1, 'personal', `${SMOKE_PREFIX} personal`)
  })

  it('documentation group upload as content creator', async () => {
    await uploadFixture(t2, 'group', `${SMOKE_PREFIX} group`)
  })
})

async function uploadFixture(
  token: string,
  uploadType: 'personal' | 'group',
  caption: string,
) {
  const bytes = readFileSync(path.join(process.cwd(), 'tests/fixtures/tiny.jpg'))
  const create = await apiJson<{ jobs?: { id: string }[] }>(token, '/documentation/jobs', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      items: [
        {
          caption,
          uploadType,
          filename: 'tiny.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: bytes.length,
        },
      ],
    }),
  })
  expectOk(create.res, 'create job')
  if (create.res.status !== 200) return

  const jobId = create.data.jobs?.[0]?.id
  expect(jobId).toBeTruthy()

  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'image/jpeg' }), 'tiny.jpg')

  const uploadRes = await fetch(
    `${getSmokeEnv().baseUrl.replace(/\/$/, '')}/yc/api/p/${token}/documentation/jobs/${jobId}/upload`,
    { method: 'POST', body: form },
  )
  expectOk(uploadRes, 'upload')
  expect(uploadRes.status).toBeLessThan(500)
}
