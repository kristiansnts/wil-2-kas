import { test, expect, smokeEnv, registerViaApi, pageIsNotFound } from './fixtures'

test.describe('challenges', () => {
  test.beforeEach(async ({ baseURL }) => {
    await registerViaApi(baseURL!, smokeEnv.token1, '[SMOKE] E2E Ch')
  })

  test('challenge list and form pages load', async ({ page }) => {
    await page.goto(`/yc/p/${smokeEnv.token1}/challenge`)
    await expect(page.getByText(/Challenge/i).first()).toBeVisible()

    await page.goto(`/yc/p/${smokeEnv.token1}/form`)
    if (await pageIsNotFound(page)) {
      test.skip(true, 'Worship form feature flag OFF — enable before game day')
      return
    }
    await expect(page.getByText('Form Worship Night')).toBeVisible()
    await expect(page.locator('textarea, input.form-input').first()).toBeVisible()
  })
})
