import { test, expect } from './fixtures'

test.describe('outbound admin', () => {
  test('pos setup and match list', async ({ adminPage }) => {
    await adminPage.goto('/yc/admin/outbound')
    await expect(adminPage.getByText(/Outbound Challenge/i).first()).toBeVisible()

    const posBtn = adminPage.getByRole('button', { name: /^1$|^Pos 1$/i }).first()
    if (await posBtn.isVisible()) {
      await posBtn.click()
      await expect(adminPage.getByText(/Ronde|Pos/i).first()).toBeVisible()
    }
  })
})
