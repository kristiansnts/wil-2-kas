import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { recalculateBalances } from '@/lib/actions/recalculation'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url), 303)
  }

  await recalculateBalances()
  return NextResponse.redirect(new URL('/admin/recalculation?done=1', req.url), 303)
}
