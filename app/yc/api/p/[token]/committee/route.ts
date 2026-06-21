import { NextResponse } from 'next/server'
import { getParticipantByToken } from '@/lib/yc/participant'
import { setYcSession } from '@/lib/yc/session'

type Params = { params: Promise<{ token: string }> }

export async function GET(req: Request, { params }: Params) {
  const { token } = await params
  const participant = await getParticipantByToken(token)
  if (!participant?.isComitee) {
    return NextResponse.redirect(new URL(`/yc/p/${token}`, req.url))
  }
  await setYcSession({ role: 'admin' })
  return NextResponse.redirect(new URL('/yc/admin/outbound', req.url))
}
