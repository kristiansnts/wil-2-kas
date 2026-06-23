import {
  test,
  expect,
  smokeEnv,
  registerViaApi,
  claimCaptainViaApi,
  claimContentCreatorViaApi,
} from './fixtures'

test.describe('group', () => {
  test.beforeEach(async ({ baseURL }) => {
    await registerViaApi(baseURL!, smokeEnv.token1, '[SMOKE] E2E G1')
    await registerViaApi(baseURL!, smokeEnv.token2, '[SMOKE] E2E G2')
    await claimCaptainViaApi(baseURL!, smokeEnv.token1)
    await claimContentCreatorViaApi(baseURL!, smokeEnv.token2)
  })

  test('group page shows captain and content creator', async ({ page }) => {
    await page.goto(`/yc/p/${smokeEnv.token1}/group`)
    await expect(page.locator('.topnav-title', { hasText: 'Kelompok' })).toBeVisible()
    await expect(page.getByText('[SMOKE] E2E G1').first()).toBeVisible()
    await expect(page.getByText('[SMOKE] E2E G2').first()).toBeVisible()
    await expect(page.getByText('Captain')).toBeVisible()
    await expect(page.getByText('Content Creator')).toBeVisible()
  })
})
