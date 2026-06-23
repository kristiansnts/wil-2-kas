import { test as base, type Page } from '@playwright/test'

export const smokeEnv = {
  token1: process.env.SMOKE_TOKEN_1 ?? 'test-smoke-1',
  token2: process.env.SMOKE_TOKEN_2 ?? 'test-smoke-2',
  token3: process.env.SMOKE_TOKEN_3 ?? 'test-smoke-3',
  token4: process.env.SMOKE_TOKEN_4 ?? 'test-smoke-4',
  adminPassword: process.env.YC_ADMIN_PASSWORD ?? '',
}

type Fixtures = {
  participantPage: (token: string) => Promise<Page>
  adminPage: Page
}

export const test = base.extend<Fixtures>({
  participantPage: async ({ browser }, use) => {
    await use(async (token: string) => {
      const context = await browser.newContext()
      const page = await context.newPage()
      return page
    })
  },

  adminPage: async ({ page }, use) => {
    if (!smokeEnv.adminPassword) {
      throw new Error('YC_ADMIN_PASSWORD required for admin E2E')
    }
    await page.goto('/yc/admin/login')
    await page.locator('input[name="password"]').fill(smokeEnv.adminPassword)
    await page.getByRole('button', { name: 'Masuk' }).click()
    await page.waitForURL(/\/yc\/admin(?!\/login)/, { timeout: 15_000 })
    await use(page)
  },
})

export { expect } from '@playwright/test'

export async function apiFetch(
  baseURL: string,
  token: string,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${baseURL}/yc/api/p/${token}${path}`, init)
}

export async function registerViaApi(
  baseURL: string,
  token: string,
  name: string,
): Promise<void> {
  const res = await apiFetch(baseURL, token, '/register', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      gender: 'MALE',
      churchName: 'Wilayah II',
      serviceInterest: [],
    }),
  })
  if (res.status >= 500) {
    throw new Error(`register failed ${res.status}`)
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(`register failed ${res.status}: ${JSON.stringify(data)}`)
  }
}

export async function claimCaptainViaApi(baseURL: string, token: string): Promise<void> {
  const res = await apiFetch(baseURL, token, '/group/claim-captain', { method: 'POST' })
  if (res.status >= 500) throw new Error(`claim captain failed ${res.status}`)
  if (res.ok) return
  const data = await res.json().catch(() => ({}))
  if (res.status === 400 && /captain sudah ada/i.test(String(data.error ?? ''))) return
  throw new Error(`claim captain failed ${res.status}: ${JSON.stringify(data)}`)
}

export async function claimContentCreatorViaApi(baseURL: string, token: string): Promise<void> {
  const res = await apiFetch(baseURL, token, '/group/claim-content-creator', { method: 'POST' })
  if (res.status >= 500) throw new Error(`claim CC failed ${res.status}`)
  if (res.ok) return
  const data = await res.json().catch(() => ({}))
  if (res.status === 400 && /content creator sudah ada/i.test(String(data.error ?? ''))) return
  throw new Error(`claim CC failed ${res.status}: ${JSON.stringify(data)}`)
}

export async function isFeatureDisabledResponse(res: Response, data: { error?: string }): Promise<boolean> {
  return res.status === 403 && /belum dibuka/i.test(String(data.error ?? ''))
}

export async function pageIsNotFound(page: Page): Promise<boolean> {
  return page.getByRole('heading', { name: '404' }).isVisible()
}
