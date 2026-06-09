import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

function validateR2Config() {
  const required = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_DOMAIN',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.warn(`[R2] Warning: Missing environment variables: ${missing.join(', ')}`)
  }
}

validateR2Config()

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  error?: string
}

export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string,
): Promise<UploadResult> {
  try {
    if (!process.env.R2_BUCKET_NAME) {
      throw new Error('R2_BUCKET_NAME is not configured')
    }
    if (!process.env.R2_PUBLIC_DOMAIN) {
      throw new Error('R2_PUBLIC_DOMAIN is not configured')
    }

    console.log('[R2] Uploading to bucket:', process.env.R2_BUCKET_NAME, 'Key:', key)

    // Set 1 year cache for CDN (31536000 seconds = 365 days)
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        'uploaded-at': new Date().toISOString(),
      },
    })

    await r2Client.send(command)

    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`

    console.log('[R2] Upload successful with 1-year cache, URL:', publicUrl)

    return {
      success: true,
      url: publicUrl,
      key,
    }
  } catch (error) {
    console.error('[R2] Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

export async function deleteFromR2(key: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })

    await r2Client.send(command)
    console.log('[R2] Deleted:', key)
    return true
  } catch (error) {
    console.error('[R2] Delete error:', error)
    return false
  }
}

export function generateR2Key(folder: string, filename: string): string {
  const timestamp = Date.now()
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${folder}/${timestamp}-${sanitized}`
}
