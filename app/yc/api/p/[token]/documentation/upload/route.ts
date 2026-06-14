import { NextResponse } from 'next/server'
import { jsonError, withParticipant } from '@/lib/yc/api-helpers'
import { createGalleryJobs, processGalleryJobUpload } from '@/lib/yc/documentation'

type Params = { params: Promise<{ token: string }> }

/** Legacy single-step upload — creates job + uploads in one request */
export async function POST(req: Request, { params }: Params) {
  const { token } = await params
  const result = await withParticipant(token)
  if ('error' in result) return result.error

  const form = await req.formData()
  const file = form.get('file')
  const caption = form.get('caption') ? String(form.get('caption')).trim() : null
  const uploadType = String(form.get('uploadType') ?? 'personal') as 'personal' | 'group'

  if (!(file instanceof File)) return jsonError('File wajib diisi')

  try {
    const [job] = await createGalleryJobs(result.participant, [{
      caption: caption ?? undefined,
      uploadType,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    }])

    const completed = await processGalleryJobUpload(result.participant.id, job.id, file)
    return NextResponse.json({
      success: true,
      job: completed,
      message: 'Upload berhasil! Menunggu review panitia.',
    })
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Upload gagal')
  }
}
