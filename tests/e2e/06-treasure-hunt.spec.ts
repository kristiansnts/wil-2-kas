import {
  test,
  expect,
  smokeEnv,
  registerViaApi,
  claimCaptainViaApi,
  apiFetch,
  isFeatureDisabledResponse,
  pageIsNotFound,
} from './fixtures'

const slug = 'treasure-hunt'
const fragment = 'yc-fragment-01'

test.describe('treasure hunt', () => {
  test.beforeEach(async ({ baseURL }) => {
    await registerViaApi(baseURL!, smokeEnv.token1, '[SMOKE] E2E TH1')
    await registerViaApi(baseURL!, smokeEnv.token2, '[SMOKE] E2E TH2')
    await claimCaptainViaApi(baseURL!, smokeEnv.token1)

    const scan = await apiFetch(baseURL!, smokeEnv.token1, `/challenges/${slug}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode: fragment }),
    })
    const scanData = await scan.json().catch(() => ({}))
    if (await isFeatureDisabledResponse(scan, scanData)) return

    await apiFetch(baseURL!, smokeEnv.token1, `/challenges/${slug}/emergency/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode: fragment }),
    })
  })

  test('emergency page shows ready UI', async ({ page, baseURL }) => {
    const probe = await apiFetch(baseURL!, smokeEnv.token1, `/challenges/${slug}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode: fragment }),
    })
    const probeData = await probe.json().catch(() => ({}))
    if (await isFeatureDisabledResponse(probe, probeData)) {
      test.skip(true, 'Team challenge feature flag OFF — enable before game day')
      return
    }

    await page.goto(`/yc/p/${smokeEnv.token1}/challenge/${slug}/emergency`)
    if (await pageIsNotFound(page)) {
      test.skip(true, 'Emergency page unavailable (no active session or feature OFF)')
      return
    }
    await expect(page.getByText(/Emergency Meeting|Kumpul di Aula|Sudah Kumpul/i).first()).toBeVisible({
      timeout: 15_000,
    })
  })
})
