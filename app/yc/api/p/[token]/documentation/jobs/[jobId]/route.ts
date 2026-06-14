import { NextResponse } from 'next/server'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { cancelGalleryJob, processGalleryJobUpload } from '@/lib/yc/documentation'

type Params = { params: Promise<{ token: string; jobId: string }> }

export async function POST(req: Request, { params }: Params) {
  const { token, jobId } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) return jsonError('File wajib diisi')

  try {
    const job = await processGalleryJobUpload(result.participant.id, jobId, file)
    return NextResponse.json({ success: true, job })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Upload gagal')
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { token, jobId } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  try {
    await cancelGalleryJob(result.participant.id, jobId)
    return NextResponse.json({ success: true })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Gagal membatalkan')
  }
}
