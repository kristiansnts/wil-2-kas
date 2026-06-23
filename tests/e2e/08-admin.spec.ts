import { test, expect } from './fixtures'

test.describe('admin', () => {
  test('dashboard, leaderboard, submissions load', async ({ adminPage }) => {
    await expect(adminPage.getByText(/YC GPdI/i).first()).toBeVisible()
    await adminPage.goto('/yc/admin/leaderboard')
    await expect(adminPage.getByText('Leaderboard')).toBeVisible()
    await adminPage.goto('/yc/admin/submissions')
    await expect(adminPage.getByText('Submissions')).toBeVisible()
  })
})
