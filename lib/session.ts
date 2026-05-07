import { cookies } from 'next/headers'

export type Session =
  | { role: 'admin' }
  | { role: 'division'; divisionId: string }

const COOKIE = 'kas-session'

export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const val = store.get(COOKIE)?.value
  if (!val) return null
  try { return JSON.parse(decodeURIComponent(val)) } catch { return null }
}

export async function setSession(session: Session): Promise<void> {
  const store = await cookies()
  store.set(COOKIE, encodeURIComponent(JSON.stringify(session)), {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })
}

export async function clearSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE)
}
