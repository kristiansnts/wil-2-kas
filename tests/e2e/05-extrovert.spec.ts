import { test, expect, smokeEnv, registerViaApi } from './fixtures'

test.describe('extrovert', () => {
  test.beforeEach(async ({ baseURL }) => {
    await registerViaApi(baseURL!, smokeEnv.token1, '[SMOKE] E2E Ex1')
    await registerViaApi(baseURL!, smokeEnv.token2, '[SMOKE] E2E Ex2')

    await fetch(`${baseURL}/yc/api/p/${smokeEnv.token1}/challenges/si-paling-extrovert/nametag/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: smokeEnv.token2 }),
    })
  })

  test('story page loads for both partners', async ({ browser, baseURL }) => {
    const ctx1 = await browser.newContext()
    const page1 = await ctx1.newPage()
    await page1.goto(`/yc/p/${smokeEnv.token1}/challenge/si-paling-extrovert`)
    await expect(page1.locator('textarea').first()).toBeVisible()

    const ctx2 = await browser.newContext()
    const page2 = await ctx2.newPage()
    await page2.goto(`/yc/p/${smokeEnv.token2}/challenge/si-paling-extrovert`)
    await expect(page2.locator('textarea').first()).toBeVisible()

    await ctx1.close()
    await ctx2.close()
  })
})
