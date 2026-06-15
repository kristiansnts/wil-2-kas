import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import QRCode from 'qrcode'
import sharp from 'sharp'

/** Youth Camp nametag card template (1128×1752). */
export const YC_QR_CARD_TEMPLATE = path.join(process.cwd(), 'public', 'qr', '1000344557.jpg')

/**
 * QR placement inside the dark-blue box on the template.
 * Measured from template pixels: box ~163–964 × 913–1671, inner padding for border.
 */
export const YC_QR_CARD_BOX = {
  left: 209,
  top: 938,
  size: 709,
} as const

export async function generateQrCardJpeg(url: string, outPath: string): Promise<void> {
  const qrPng = await QRCode.toBuffer(url, {
    type: 'png',
    width: YC_QR_CARD_BOX.size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  })

  await sharp(YC_QR_CARD_TEMPLATE)
    .composite([{ input: qrPng, left: YC_QR_CARD_BOX.left, top: YC_QR_CARD_BOX.top }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(outPath)
}

export async function generateQrCardJpegBuffer(url: string): Promise<Buffer> {
  const qrPng = await QRCode.toBuffer(url, {
    type: 'png',
    width: YC_QR_CARD_BOX.size,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  })

  return sharp(YC_QR_CARD_TEMPLATE)
    .composite([{ input: qrPng, left: YC_QR_CARD_BOX.left, top: YC_QR_CARD_BOX.top }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer()
}

export type QrCardManifestEntry = {
  no: number
  token: string
  url: string
  file: string
  cardFile?: string
}

export type QrCardManifest = {
  baseUrl: string
  generatedAt: string
  template: string
  panitia: QrCardManifestEntry[]
  peserta: QrCardManifestEntry[]
}

export async function readQrManifest(manifestPath: string): Promise<QrCardManifest> {
  const raw = await readFile(manifestPath, 'utf8')
  return JSON.parse(raw) as QrCardManifest
}

export async function writeQrManifest(manifestPath: string, manifest: QrCardManifest): Promise<void> {
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
}
