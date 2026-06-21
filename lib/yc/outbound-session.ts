import { cookies } from 'next/headers'
import { isValidOutboundPosition } from '@/lib/yc/outbound-data'

const COOKIE = 'yc-outbound-pos'

export async function getOutboundPosition(): Promise<number | null> {
  const store = await cookies()
  const val = store.get(COOKIE)?.value
  const n = Number(val)
  return isValidOutboundPosition(n) ? n : null
}

export async function setOutboundPositionCookie(position: number): Promise<void> {
  if (!isValidOutboundPosition(position)) {
    throw new Error('Pos tidak valid')
  }
  const store = await cookies()
  store.set(COOKIE, String(position), {
    httpOnly: true,
    path: '/yc/admin/outbound',
    maxAge: 60 * 60 * 24 * 3,
    sameSite: 'lax',
  })
}

export async function clearOutboundPositionCookie(): Promise<void> {
  const store = await cookies()
  store.delete({ name: COOKIE, path: '/yc/admin/outbound' })
}
