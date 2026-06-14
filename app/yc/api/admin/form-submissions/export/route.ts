import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getYcSession } from '@/lib/yc/session'

function csvField(value: string): string {
  const normalized = value.trim().replace(/\r?\n/g, ' ')
  if (/[",]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`
  }
  return normalized
}

export async function GET() {
  const session = await getYcSession()
  if (!session || session.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const rows = await prisma.ycFormSubmission.findMany({
    orderBy: { createdAt: 'asc' },
    select: { answer: true },
  })

  const body = rows.map(r => csvField(r.answer)).join(',')

  const date = new Date().toISOString().slice(0, 10)
  const filename = `worship-night-submissions-${date}.txt`

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
