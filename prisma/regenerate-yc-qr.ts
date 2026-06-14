import 'dotenv/config'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { buildParticipantUrl, normalizeQrBaseUrl, resolveQrBaseUrl } from '../lib/yc/participant-url'

const QR_DIR = path.join(process.cwd(), 'public', 'qr')

type ManifestEntry = { no: number; token: string; url: string; file: string }

type QrManifest = {
  baseUrl: string
  generatedAt: string
  panitia: ManifestEntry[]
  peserta: ManifestEntry[]
}

async function generateQrWebp(url: string, outPath: string) {
  const png = await QRCode.toBuffer(url, {
    type: 'png',
    width: 200,
    margin: 1,
    errorCorrectionLevel: 'L',
    color: { dark: '#000000', light: '#ffffff' },
  })
  const webp = await sharp(png)
    .webp({ quality: 55, effort: 6, smartSubsample: true })
    .toBuffer()
  await writeFile(outPath, webp)
}

async function regenerateGroup(
  entries: ManifestEntry[],
  baseUrl: string,
  label: string,
): Promise<ManifestEntry[]> {
  const updated: ManifestEntry[] = []
  for (const entry of entries) {
    const url = buildParticipantUrl(baseUrl, entry.token)
    const outPath = path.join(process.cwd(), 'public', entry.file.replace(/^\//, ''))
    await mkdir(path.dirname(outPath), { recursive: true })
    await generateQrWebp(url, outPath)
    updated.push({ ...entry, url })
    console.log(`  ${label} #${entry.no}: ${url}`)
  }
  return updated
}

async function main() {
  const manifestPath = path.join(QR_DIR, 'manifest.json')
  const raw = await readFile(manifestPath, 'utf8')
  const manifest = JSON.parse(raw) as QrManifest

  const baseUrl = normalizeQrBaseUrl(resolveQrBaseUrl())
  console.log(`Regenerating YC QR codes (tokens unchanged)`)
  console.log(`Base URL: ${baseUrl}`)

  console.log(`Panitia (${manifest.panitia.length})...`)
  const panitia = await regenerateGroup(manifest.panitia, baseUrl, 'panitia')

  console.log(`Peserta (${manifest.peserta.length})...`)
  const peserta = await regenerateGroup(manifest.peserta, baseUrl, 'peserta')

  const updated: QrManifest = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    panitia,
    peserta,
  }

  await writeFile(manifestPath, JSON.stringify(updated, null, 2))
  console.log(`Done. Manifest updated: public/qr/manifest.json`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
