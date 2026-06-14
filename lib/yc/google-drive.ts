import { google } from 'googleapis'
import { Readable } from 'stream'

const OAUTH_REDIRECT_URI = 'https://developers.google.com/oauthplayground'

function getDriveClient() {
  const approvedFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  const reviewFolderId = process.env.GOOGLE_DRIVE_FOLDER_REVIEW_ID
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN

  if (!approvedFolderId || !reviewFolderId || !clientId || !clientSecret || !refreshToken) {
    return null
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, OAUTH_REDIRECT_URI)
  oauth2.setCredentials({ refresh_token: refreshToken })

  return {
    drive: google.drive({ version: 'v3', auth: oauth2 }),
    approvedFolderId,
    reviewFolderId,
  }
}

function driveUploadErrorMessage(err: unknown): string {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err && 'message' in err
        ? String((err as { message: unknown }).message)
        : ''

  if (message.includes('invalid_grant')) {
    return (
      'Refresh token Google Drive tidak valid atau kedaluwarsa. ' +
      'Generate ulang di OAuth Playground dan update GOOGLE_OAUTH_REFRESH_TOKEN.'
    )
  }

  return message || 'Upload ke Google Drive gagal'
}

export type DriveUploadResult = {
  fileId: string
  fileUrl: string
}

export function driveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`
}

/** Upload ke folder review — dipakai saat peserta submit dokumentasi */
export async function uploadToGoogleDriveReview(
  buffer: Buffer,
  filename: string,
  mimeType: string,
): Promise<DriveUploadResult> {
  const client = getDriveClient()
  if (!client) {
    throw new Error('Google Drive belum dikonfigurasi')
  }

  const { drive, reviewFolderId } = client

  let res
  try {
    res = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [reviewFolderId],
      },
      media: {
        mimeType,
        body: Readable.from(buffer),
      },
      fields: 'id',
      supportsAllDrives: true,
    })
  } catch (err) {
    throw new Error(driveUploadErrorMessage(err))
  }

  const fileId = res.data.id
  if (!fileId) throw new Error('Upload gagal: tidak ada file ID')

  return { fileId, fileUrl: driveFileUrl(fileId) }
}

/** Pindahkan file dari folder review ke folder approved setelah panitia approve */
export async function moveGoogleDriveFileToApproved(fileId: string): Promise<DriveUploadResult> {
  const client = getDriveClient()
  if (!client) {
    throw new Error('Google Drive belum dikonfigurasi')
  }

  const { drive, approvedFolderId, reviewFolderId } = client

  try {
    await drive.files.update({
      fileId,
      addParents: approvedFolderId,
      removeParents: reviewFolderId,
      supportsAllDrives: true,
      fields: 'id',
    })
  } catch (err) {
    throw new Error(driveUploadErrorMessage(err))
  }

  return { fileId, fileUrl: driveFileUrl(fileId) }
}

/** Hapus file dari Google Drive — dipakai saat panitia reject */
export async function deleteGoogleDriveFile(fileId: string): Promise<void> {
  const client = getDriveClient()
  if (!client) {
    throw new Error('Google Drive belum dikonfigurasi')
  }

  try {
    await client.drive.files.delete({
      fileId,
      supportsAllDrives: true,
    })
  } catch (err) {
    throw new Error(driveUploadErrorMessage(err))
  }
}

export function isDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_FOLDER_ID &&
      process.env.GOOGLE_DRIVE_FOLDER_REVIEW_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  )
}
