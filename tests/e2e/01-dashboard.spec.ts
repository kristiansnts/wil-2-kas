import { test, expect, smokeEnv, registerViaApi } from './fixtures'

test.describe('dashboard', () => {
  test('loads menus for registered smoke users', async ({ page, baseURL }) => {
    await registerViaApi(baseURL!, smokeEnv.token1, '[SMOKE] E2E Dash 1')
    await registerViaApi(baseURL!, smokeEnv.token3, '[SMOKE] E2E Dash 3')

    await page.goto(`/yc/p/${smokeEnv.token1}`)
    await expect(page.getByText('Dashboard Peserta')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Challenge' })).toBeVisible()

    await page.goto(`/yc/p/${smokeEnv.token3}`)
    await expect(page.getByText('Dashboard Peserta')).toBeVisible()
  })
})
