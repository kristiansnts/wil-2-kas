import { describe, expect, it } from 'vitest'
import { adminUrl } from '../helpers/smoke-api'

describe('YC admin gate smoke', () => {
  it('anonymous admin dashboard redirects to login', async () => {
    const res = await fetch(adminUrl('/yc/admin'), { redirect: 'manual' })
    expect([302, 307, 308]).toContain(res.status)
    const location = res.headers.get('location') ?? ''
    expect(location).toMatch(/login/i)
  })

  it('form export requires auth', async () => {
    const res = await fetch(adminUrl('/yc/api/admin/form-submissions/export'), {
      redirect: 'manual',
    })
    // 401 when hit directly on www; 308 if apex redirect without follow
    expect([401, 403, 302, 307, 308]).toContain(res.status)
    if (res.status === 401 || res.status === 403) {
      expect(res.status).toBeLessThan(500)
    }
  })
})
