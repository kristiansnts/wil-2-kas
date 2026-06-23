import { test, expect, smokeEnv, registerViaApi } from './fixtures'

test.describe('isolation', () => {
  test('team B does not see team A emergency on dashboard poll', async ({ browser, baseURL }) => {
    await registerViaApi(baseURL!, smokeEnv.token1, '[SMOKE] E2E Iso1')
    await registerViaApi(baseURL!, smokeEnv.token3, '[SMOKE] E2E Iso3')

    await fetch(`${baseURL}/yc/api/p/${smokeEnv.token1}/challenges/treasure-hunt/emergency/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode: 'yc-fragment-01' }),
    })

    const ctxB = await browser.newContext()
    const pageB = await ctxB.newPage()
    await pageB.goto(`/yc/p/${smokeEnv.token3}`)
    await pageB.waitForTimeout(3000)
    await expect(pageB.getByText(/Emergency Meeting/i)).not.toBeVisible()
    await ctxB.close()
  })
})
