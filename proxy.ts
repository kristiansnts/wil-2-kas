import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type Session = { role: 'admin' } | { role: 'division'; divisionId: string }

function parseSession(req: NextRequest): Session | null {
  const val = req.cookies.get('kas-session')?.value
  if (!val) return null
  try { return JSON.parse(decodeURIComponent(val)) } catch { return null }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/login')) return NextResponse.next()
  if (pathname.startsWith('/meeting/')) return NextResponse.next()

  const session = parseSession(req)
  if (!session) return NextResponse.redirect(new URL('/login', req.url))

  if (pathname === '/') {
    if (session.role !== 'admin') return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/divisi/')) {
    if (session.role === 'admin') return NextResponse.next()
    if (session.role !== 'division') return NextResponse.redirect(new URL('/login', req.url))
    const divisionId = pathname.split('/')[2]
    if (divisionId !== session.divisionId) return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/laporan')) {
    // both admin and division users may access laporan
    if (!session) return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
