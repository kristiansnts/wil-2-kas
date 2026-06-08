import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { approveSubmission } from '@/lib/actions/submission'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> },
) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url), 303)
  }

  const { id, subId } = await params
  await approveSubmission(subId)

  return NextResponse.redirect(new URL(`/pertemuan/${id}`, req.url), 303)
}
