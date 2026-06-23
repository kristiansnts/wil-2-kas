import { test, expect, smokeEnv } from './fixtures'

test.describe('register', () => {
  test('UI form submits and reaches dashboard', async ({ page }) => {
    const token = smokeEnv.token1
    await page.goto(`/yc/p/${token}/register`)
    await page.locator('input.form-input').first().fill('[SMOKE] E2E Register')
    await page.getByLabel('Laki-laki').check()

    await page.getByText('Pilih gereja').click()
    await page.locator('.searchable-search').fill('Wilayah')
    await page.locator('.searchable-option').first().click()

    await page.getByRole('button', { name: /Simpan/i }).click()
    await page.waitForURL(new RegExp(`/yc/p/${token}$`), { timeout: 15_000 })
    await expect(page.getByText('Dashboard Peserta')).toBeVisible()
  })
})
