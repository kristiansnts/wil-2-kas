import {
  test,
  expect,
  smokeEnv,
  registerViaApi,
  claimCaptainViaApi,
  claimContentCreatorViaApi,
} from './fixtures'

test.describe('dokumentasi', () => {
  test.beforeEach(async ({ baseURL }) => {
    await registerViaApi(baseURL!, smokeEnv.token1, '[SMOKE] E2E Doc1')
    await registerViaApi(baseURL!, smokeEnv.token2, '[SMOKE] E2E Doc2')
    await claimCaptainViaApi(baseURL!, smokeEnv.token1)
    await claimContentCreatorViaApi(baseURL!, smokeEnv.token2)
  })

  test('upload page loads', async ({ page }) => {
    await page.goto(`/yc/p/${smokeEnv.token2}/dokumentasi`)
    await expect(page.locator('.topnav-title', { hasText: 'Dokumentasi' })).toBeVisible()
    await expect(page.locator('input[type="file"]').first()).toBeVisible()
  })
})
