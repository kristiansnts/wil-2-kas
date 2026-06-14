import { NextResponse } from 'next/server'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { createGalleryJobs, listParticipantGalleryJobs } from '@/lib/yc/documentation'

type Params = { params: Promise<{ token: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const jobs = await listParticipantGalleryJobs(result.participant.id)
  return NextResponse.json({ jobs })
}

export async function POST(req: Request, { params }: Params) {
  const { token } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonError('Body JSON tidak valid')
  }

  const items = (body as { items?: unknown }).items
  if (!Array.isArray(items) || items.length === 0) {
    return jsonError('items wajib berisi minimal 1 file')
  }

  try {
    const jobs = await createGalleryJobs(result.participant, items as {
      caption?: string
      uploadType: 'personal' | 'group'
      filename: string
      mimeType: string
      sizeBytes: number
    }[])
    return NextResponse.json({ jobs })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Gagal membuat job')
  }
}
