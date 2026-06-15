import 'dotenv/config'
import { mkdir } from 'fs/promises'
import path from 'path'
import { buildParticipantUrl, normalizeQrBaseUrl, resolveQrBaseUrl } from '../lib/yc/participant-url'
import {
  generateQrCardJpeg,
  readQrManifest,
  writeQrManifest,
  type QrCardManifestEntry,
  YC_QR_CARD_TEMPLATE,
} from '../lib/yc/qr-card'

const QR_DIR = path.join(process.cwd(), 'public', 'qr')
const CARDS_DIR = path.join(QR_DIR, 'cards')

function padNum(n: number, width: number) {
  return String(n).padStart(width, '0')
}

async function generateGroup(
  entries: QrCardManifestEntry[],
  subdir: string,
  padWidth: number,
  baseUrl: string,
  label: string,
): Promise<QrCardManifestEntry[]> {
  const outDir = path.join(CARDS_DIR, subdir)
  await mkdir(outDir, { recursive: true })

  const updated: QrCardManifestEntry[] = []
  for (const entry of entries) {
    const url = buildParticipantUrl(baseUrl, entry.token)
    const filename = `${padNum(entry.no, padWidth)}.jpg`
    const cardFile = `/qr/cards/${subdir}/${filename}`
    const outPath = path.join(outDir, filename)
    await generateQrCardJpeg(url, outPath)
    updated.push({ ...entry, url, cardFile })
    console.log(`  ${label} #${entry.no}: ${cardFile}`)
  }
  return updated
}

async function main() {
  const manifestPath = path.join(QR_DIR, 'manifest.json')
  const manifest = await readQrManifest(manifestPath)
  const baseUrl = normalizeQrBaseUrl(resolveQrBaseUrl())

  console.log('Generating YC QR cards')
  console.log(`Template: ${path.relative(process.cwd(), YC_QR_CARD_TEMPLATE)}`)
  console.log(`Base URL: ${baseUrl}`)

  console.log(`Panitia (${manifest.panitia.length})...`)
  const panitia = await generateGroup(manifest.panitia, 'panitia', 2, baseUrl, 'panitia')

  console.log(`Peserta (${manifest.peserta.length})...`)
  const peserta = await generateGroup(manifest.peserta, 'peserta', 3, baseUrl, 'peserta')

  await writeQrManifest(manifestPath, {
    ...manifest,
    baseUrl,
    generatedAt: new Date().toISOString(),
    template: '/qr/1000344557.jpg',
    panitia,
    peserta,
  })

  console.log(`Done. Cards: public/qr/cards/panitia/*.jpg, public/qr/cards/peserta/*.jpg`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
