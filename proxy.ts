import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type Session = { role: 'admin' } | { role: 'division'; divisionId: string }

function parseSession(req: NextRequest): Session | null {
  const val = req.cookies.get('kas-session')?.value
  if (!val) return null
  try { return JSON.parse(decodeURIComponent(val)) } catch { return null }
}

function parseYcSession(req: NextRequest): { role: 'admin' } | null {
  const val = req.cookies.get('yc-session')?.value
  if (!val) return null
  try { return JSON.parse(decodeURIComponent(val)) } catch { return null }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static files in public/ — YC participants have no kas-session
  if (
    pathname.startsWith('/group-icon/') ||
    pathname.startsWith('/sound/') ||
    pathname.startsWith('/qr/') ||
    pathname.startsWith('/treasure-hunt/')
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/yc/')) {
    if (
      pathname.startsWith('/yc/p/') ||
      pathname.startsWith('/yc/api/') ||
      pathname === '/yc/admin/login'
    ) return NextResponse.next()

    if (pathname.startsWith('/yc/admin')) {
      if (!parseYcSession(req)) {
        return NextResponse.redirect(new URL('/yc/admin/login', req.url))
      }
      return NextResponse.next()
    }

    return NextResponse.next()
  }

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
