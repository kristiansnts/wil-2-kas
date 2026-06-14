import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type YcSession = { role: 'admin' }

const COOKIE = 'yc-session'

export async function getYcSession(): Promise<YcSession | null> {
  const store = await cookies()
  const val = store.get(COOKIE)?.value
  if (!val) return null
  try {
    return JSON.parse(decodeURIComponent(val)) as YcSession
  } catch {
    return null
  }
}

export async function setYcSession(session: YcSession): Promise<void> {
  const store = await cookies()
  store.set(COOKIE, encodeURIComponent(JSON.stringify(session)), {
    httpOnly: true,
    path: '/yc',
    maxAge: 60 * 60 * 24 * 3,
    sameSite: 'lax',
  })
}

export async function clearYcSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}

export async function requireYcAdmin(): Promise<YcSession> {
  const session = await getYcSession()
  if (!session || session.role !== 'admin') {
    redirect('/yc/admin/login')
  }
  return session
}

export function verifyYcAdminPassword(password: string): boolean {
  const expected = process.env.YC_ADMIN_PASSWORD
  if (!expected) return false
  return password === expected
}
