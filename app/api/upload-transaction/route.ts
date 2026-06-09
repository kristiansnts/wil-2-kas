import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { generateR2Key, uploadToR2 } from '@/lib/r2'

export async function POST(req: NextRequest) {
  try {
    if (
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME ||
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_PUBLIC_DOMAIN
    ) {
      console.error('[Transaction Upload] Missing R2 environment variables')
      return NextResponse.json({ error: 'Server configuration error - R2 not configured' }, { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // iOS 14 Safari sometimes sends empty MIME types, so we validate by extension as fallback
    const validMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', '']
    const fileExtension = file.name.toLowerCase().split('.').pop()
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp']

    if (!validMimeTypes.includes(file.type) && !validExtensions.includes(fileExtension || '')) {
      console.error('[Transaction Upload] Invalid file type:', file.type, 'Extension:', fileExtension)
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and images (JPG, PNG, WebP) are allowed.' },
        { status: 400 },
      )
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      console.error('[Transaction Upload] File too large:', file.size)
      return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 })
    }

    console.log('[Transaction Upload] Starting upload - File:', file.name, 'Type:', file.type, 'Size:', file.size)

    const bytes = await file.arrayBuffer()
    let buffer: Buffer = Buffer.from(bytes) as Buffer

    // Determine if file is an image (for optimization)
    const ext = file.name.toLowerCase().split('.').pop()
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')
    const isPDF = ext === 'pdf'

    let finalFilename = file.name
    let contentType = file.type

    // Optimize images to WebP format for better compression and caching
    if (isImage) {
      console.log('[Transaction Upload] Optimizing image to WebP format')
      try {
        buffer = await sharp(buffer)
          .webp({ quality: 85, effort: 4 })
          .toBuffer()

        // Update filename extension to .webp
        const nameWithoutExt = file.name.replace(/\.(jpg|jpeg|png|webp)$/i, '')
        finalFilename = `${nameWithoutExt}.webp`
        contentType = 'image/webp'

        console.log('[Transaction Upload] Image optimized - Original:', file.size, 'Optimized:', buffer.length, 'Reduction:', ((1 - buffer.length / file.size) * 100).toFixed(1) + '%')
      } catch (err) {
        console.error('[Transaction Upload] Image optimization failed, uploading original:', err)
        // Fall back to original buffer if optimization fails
        buffer = Buffer.from(bytes) as Buffer
      }
    }

    // iOS 14 sometimes sends empty MIME type, infer from extension
    if (!contentType || contentType === '') {
      const mimeMap: Record<string, string> = {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      }
      contentType = mimeMap[ext || ''] || 'application/octet-stream'
    }

    const key = generateR2Key('transactions', finalFilename)

    console.log('[Transaction Upload] Uploading to R2 with key:', key, 'ContentType:', contentType)
    const result = await uploadToR2(buffer, key, contentType)

    if (!result.success) {
      console.error('[Transaction Upload] R2 upload failed:', result.error)
      return NextResponse.json({ error: result.error || 'Failed to upload to storage' }, { status: 500 })
    }

    console.log('[Transaction Upload] R2 upload successful:', result.url)

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
    })
  } catch (error) {
    console.error('[Transaction Upload] Failed to upload:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
