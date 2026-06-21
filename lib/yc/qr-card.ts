import { access, mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { buildParticipantUrl, normalizeQrBaseUrl, resolveQrBaseUrl } from './participant-url'

/** Youth Camp nametag card template (1128×1752). */
export const YC_QR_CARD_TEMPLATE = path.join(process.cwd(), 'public', 'qr', '1000344557.jpg')
export const YC_QR_DIR = path.join(process.cwd(), 'public', 'qr')
export const YC_QR_CARDS_DIR = path.join(YC_QR_DIR, 'cards')

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

export function padQrCardNum(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

export async function assertQrCardTemplate(): Promise<void> {
  try {
    await access(YC_QR_CARD_TEMPLATE)
  } catch {
    throw new Error(
      `Template nametag tidak ditemukan: ${YC_QR_CARD_TEMPLATE}\n` +
        'Taruh file 1000344557.jpg di public/qr/ lalu jalankan ulang.',
    )
  }
}

export async function generateQrCardGroup(
  entries: QrCardManifestEntry[],
  subdir: string,
  padWidth: number,
  baseUrl: string,
): Promise<QrCardManifestEntry[]> {
  const outDir = path.join(YC_QR_CARDS_DIR, subdir)
  await mkdir(outDir, { recursive: true })

  const updated: QrCardManifestEntry[] = []
  for (const entry of entries) {
    const url = buildParticipantUrl(baseUrl, entry.token)
    const filename = `${padQrCardNum(entry.no, padWidth)}.jpg`
    const cardFile = `/qr/cards/${subdir}/${filename}`
    const outPath = path.join(outDir, filename)
    await generateQrCardJpeg(url, outPath)
    updated.push({ ...entry, url, cardFile })
  }
  return updated
}

export async function generateAllYcQrCards(manifestPath = path.join(YC_QR_DIR, 'manifest.json')): Promise<QrCardManifest> {
  await assertQrCardTemplate()

  const manifest = await readQrManifest(manifestPath)
  const baseUrl = normalizeQrBaseUrl(resolveQrBaseUrl())

  const panitia = await generateQrCardGroup(manifest.panitia, 'panitia', 2, baseUrl)
  const peserta = await generateQrCardGroup(manifest.peserta, 'peserta', 3, baseUrl)

  const updated: QrCardManifest = {
    ...manifest,
    baseUrl,
    generatedAt: new Date().toISOString(),
    template: '/qr/1000344557.jpg',
    panitia,
    peserta,
  }

  await writeQrManifest(manifestPath, updated)
  return updated
}

function cardPathForEntry(entry: QrCardManifestEntry, subdir: string, padWidth: number): string {
  if (entry.cardFile) {
    return path.join(process.cwd(), 'public', entry.cardFile.replace(/^\//, ''))
  }
  return path.join(YC_QR_CARDS_DIR, subdir, `${padQrCardNum(entry.no, padWidth)}.jpg`)
}

async function cardsExistForGroup(
  entries: QrCardManifestEntry[],
  subdir: string,
  padWidth: number,
): Promise<boolean> {
  for (const entry of entries) {
    try {
      await access(cardPathForEntry(entry, subdir, padWidth))
    } catch {
      return false
    }
  }
  return true
}

function attachCardFiles(
  entries: QrCardManifestEntry[],
  subdir: string,
  padWidth: number,
): QrCardManifestEntry[] {
  return entries.map(entry => {
    const filename = `${padQrCardNum(entry.no, padWidth)}.jpg`
    const cardFile = entry.cardFile ?? `/qr/cards/${subdir}/${filename}`
    return { ...entry, cardFile }
  })
}

/** Use existing card JPEGs when complete; otherwise regenerate from template. */
export async function ensureYcQrCards(manifestPath = path.join(YC_QR_DIR, 'manifest.json')): Promise<QrCardManifest> {
  const manifest = await readQrManifest(manifestPath)
  const panitiaReady = await cardsExistForGroup(manifest.panitia, 'panitia', 2)
  const pesertaReady = await cardsExistForGroup(manifest.peserta, 'peserta', 3)

  if (panitiaReady && pesertaReady) {
    const updated: QrCardManifest = {
      ...manifest,
      panitia: attachCardFiles(manifest.panitia, 'panitia', 2),
      peserta: attachCardFiles(manifest.peserta, 'peserta', 3),
    }
    await writeQrManifest(manifestPath, updated)
    return updated
  }

  return generateAllYcQrCards(manifestPath)
}
