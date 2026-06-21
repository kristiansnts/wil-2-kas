'use server'

import { revalidatePath } from 'next/cache'
import { requireYcAdmin } from '@/lib/yc/session'
import { approveGalleryUpload, rejectGalleryUpload } from '@/lib/yc/documentation'

export async function approveGallerySubmission(uploadId: string) {
  await requireYcAdmin()
  const res = await approveGalleryUpload(uploadId)
  if ('error' in res) return res
  revalidatePath('/yc/admin/submissions')
  revalidatePath('/yc/admin')
  return res
}

export async function rejectGallerySubmission(uploadId: string, reviewComment: string) {
  await requireYcAdmin()
  const res = await rejectGalleryUpload(uploadId, reviewComment)
  if ('error' in res) return res
  revalidatePath('/yc/admin/submissions')
  revalidatePath('/yc/admin')
  return res
}
