import { prisma } from '@/lib/prisma'
import { YC_MAX_UPLOAD_BYTES } from './constants'
import { isGroupContentCreator } from './participant'
import { uploadToGoogleDriveReview, moveGoogleDriveFileToApproved, deleteGoogleDriveFile, isDriveConfigured } from './google-drive'
import { awardTukangNgontenOnApproval } from './tukang-ngonten'
import type { YcGalleryUploadStatus } from '@/app/generated/prisma/client'

export type GalleryJobItem = {
  caption?: string
  uploadType: 'personal' | 'group'
  filename: string
  mimeType: string
  sizeBytes: number
}

export type GalleryJobPublic = {
  id: string
  status: YcGalleryUploadStatus
  uploadType: string
  caption: string | null
  originalFilename: string | null
  mimeType: string | null
  fileSizeBytes: number | null
  mediaUrl: string | null
  reviewComment: string | null
  errorMessage: string | null
  uploadedAt: string
  reviewedAt: string | null
}

function serializeJob(row: {
  id: string
  status: YcGalleryUploadStatus
  uploadType: string
  caption: string | null
  originalFilename: string | null
  mimeType: string | null
  fileSizeBytes: number | null
  mediaUrl: string | null
  reviewComment: string | null
  errorMessage: string | null
  uploadedAt: Date
  reviewedAt: Date | null
}): GalleryJobPublic {
  return {
    id: row.id,
    status: row.status,
    uploadType: row.uploadType,
    caption: row.caption,
    originalFilename: row.originalFilename,
    mimeType: row.mimeType,
    fileSizeBytes: row.fileSizeBytes,
    mediaUrl: row.mediaUrl,
    reviewComment: row.reviewComment,
    errorMessage: row.errorMessage,
    uploadedAt: row.uploadedAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  }
}

function validateFileMeta(mimeType: string, sizeBytes: number): string | null {
  const isVideo = mimeType.startsWith('video/')
  const maxBytes = isVideo ? YC_MAX_UPLOAD_BYTES.video : YC_MAX_UPLOAD_BYTES.image
  if (sizeBytes > maxBytes) return 'Ukuran file terlalu besar'
  if (!mimeType.startsWith('image/') && !mimeType.startsWith('video/')) {
    return 'Hanya foto atau video yang diperbolehkan'
  }
  return null
}

export async function listParticipantGalleryJobs(participantId: string): Promise<GalleryJobPublic[]> {
  const rows = await prisma.ycGalleryUpload.findMany({
    where: { participantId },
    orderBy: { uploadedAt: 'desc' },
    take: 50,
  })
  return rows.map(serializeJob)
}

export async function createGalleryJobs(
  participant: {
    id: string
    name: string | null
    groupId: string | null
    group: { contentCreator: { id: string } | null } | null
  },
  items: GalleryJobItem[],
) {
  if (!participant.name) throw new Error('Lengkapi registrasi dulu')
  if (items.length === 0) throw new Error('Tidak ada file')

  const jobs = []
  for (const item of items) {
    const fileErr = validateFileMeta(item.mimeType, item.sizeBytes)
    if (fileErr) throw new Error(`${item.filename}: ${fileErr}`)

    const isGroup = item.uploadType === 'group'
    if (isGroup) {
      if (!participant.groupId) throw new Error('Kamu belum masuk kelompok')
      if (!isGroupContentCreator(participant)) {
        throw new Error('Hanya content creator kelompok yang bisa upload sebagai kelompok')
      }
    }

    const job = await prisma.ycGalleryUpload.create({
      data: {
        participantId: participant.id,
        groupId: isGroup ? participant.groupId : null,
        uploadType: item.uploadType,
        caption: item.caption?.trim() || null,
        originalFilename: item.filename,
        mimeType: item.mimeType,
        fileSizeBytes: item.sizeBytes,
        status: 'QUEUED',
      },
    })
    jobs.push(serializeJob(job))
  }

  return jobs
}

export async function processGalleryJobUpload(
  participantId: string,
  jobId: string,
  file: File,
) {
  const job = await prisma.ycGalleryUpload.findFirst({
    where: { id: jobId, participantId },
  })
  if (!job) throw new Error('Job tidak ditemukan')
  if (job.status !== 'QUEUED' && job.status !== 'FAILED') {
    throw new Error('Job tidak bisa diupload ulang')
  }

  const mimeType = file.type || job.mimeType || 'application/octet-stream'
  const fileErr = validateFileMeta(mimeType, file.size)
  if (fileErr) throw new Error(fileErr)

  await prisma.ycGalleryUpload.update({
    where: { id: jobId },
    data: { status: 'UPLOADING', errorMessage: null },
  })

  let mediaUrl: string
  let driveFileId: string | null = null

  try {
    if (isDriveConfigured()) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const uploaded = await uploadToGoogleDriveReview(buffer, file.name, mimeType)
      mediaUrl = uploaded.fileUrl
      driveFileId = uploaded.fileId
    } else {
      mediaUrl = `local://${file.name}`
    }

    const updated = await prisma.ycGalleryUpload.update({
      where: { id: jobId },
      data: {
        status: 'PENDING_REVIEW',
        mediaUrl,
        driveFileId,
        mimeType,
        fileSizeBytes: file.size,
        originalFilename: file.name,
        errorMessage: null,
      },
    })

    return serializeJob(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload gagal'
    await prisma.ycGalleryUpload.update({
      where: { id: jobId },
      data: { status: 'FAILED', errorMessage: message },
    })
    throw new Error(message)
  }
}

export async function cancelGalleryJob(participantId: string, jobId: string) {
  const job = await prisma.ycGalleryUpload.findFirst({
    where: { id: jobId, participantId },
  })
  if (!job) throw new Error('Job tidak ditemukan')
  if (!['QUEUED', 'FAILED'].includes(job.status)) {
    throw new Error('Hanya job antrian atau gagal yang bisa dibatalkan')
  }
  await prisma.ycGalleryUpload.delete({ where: { id: jobId } })
  return { ok: true }
}

export async function listPendingGalleryForAdmin() {
  return prisma.ycGalleryUpload.findMany({
    where: { status: 'PENDING_REVIEW' },
    include: {
      participant: true,
      group: true,
    },
    orderBy: { uploadedAt: 'asc' },
  })
}

export async function approveGalleryUpload(uploadId: string) {
  const upload = await prisma.ycGalleryUpload.findUnique({
    where: { id: uploadId },
  })
  if (!upload || upload.status !== 'PENDING_REVIEW') {
    return { error: 'Upload tidak valid' }
  }
  if (!upload.participantId || !upload.mediaUrl) {
    return { error: 'Data upload tidak lengkap' }
  }

  const isGroup = upload.uploadType === 'group'

  let mediaUrl = upload.mediaUrl
  let driveFileId = upload.driveFileId

  if (isDriveConfigured() && upload.driveFileId) {
    try {
      const moved = await moveGoogleDriveFileToApproved(upload.driveFileId)
      mediaUrl = moved.fileUrl
      driveFileId = moved.fileId
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memindahkan file ke folder approved'
      return { error: message }
    }
  }

  const result = await awardTukangNgontenOnApproval({
    participantId: upload.participantId,
    groupId: upload.groupId,
    uploadType: isGroup ? 'group' : 'personal',
    mediaUrl,
    driveFileId,
    caption: upload.caption,
  })

  if (!result) return { error: 'Challenge tidak aktif' }

  await prisma.ycGalleryUpload.update({
    where: { id: uploadId },
    data: {
      status: 'APPROVED',
      submissionId: result.submissionId,
      mediaUrl,
      driveFileId,
      reviewedAt: new Date(),
    },
  })

  return { ok: true, pointsAwarded: result.pointsAwarded, pointTarget: result.pointTarget }
}

export async function rejectGalleryUpload(uploadId: string, reviewComment: string) {
  const comment = reviewComment.trim()
  if (!comment) return { error: 'Komentar penolakan wajib diisi' }

  const upload = await prisma.ycGalleryUpload.findUnique({ where: { id: uploadId } })
  if (!upload || upload.status !== 'PENDING_REVIEW') {
    return { error: 'Upload tidak valid' }
  }

  if (isDriveConfigured() && upload.driveFileId) {
    try {
      await deleteGoogleDriveFile(upload.driveFileId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus file dari Google Drive'
      return { error: message }
    }
  }

  await prisma.ycGalleryUpload.update({
    where: { id: uploadId },
    data: {
      status: 'REJECTED',
      reviewComment: comment,
      mediaUrl: null,
      driveFileId: null,
      reviewedAt: new Date(),
    },
  })

  return { ok: true }
}
