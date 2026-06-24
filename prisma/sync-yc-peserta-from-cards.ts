import 'dotenv/config'
import { readdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import jsQR from 'jsqr'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { getDirectDatabaseUrl } from '../lib/database-url'
import { parseParticipantTokenFromQr } from '../lib/yc/parse-participant-qr'
import { buildParticipantUrl, normalizeQrBaseUrl, resolveQrBaseUrl } from '../lib/yc/participant-url'
import {
  readQrManifest,
  writeQrManifest,
  YC_QR_CARD_BOX,
  type QrCardManifestEntry,
} from '../lib/yc/qr-card'

const PESERTA_DIR = path.join(process.cwd(), 'public', 'qr', 'peserta')
const MANIFEST_PATH = path.join(process.cwd(), 'public', 'qr', 'manifest.json')
const SMOKE_TOKEN_PREFIX = 'test-smoke'

const adapter = new PrismaPg({ connectionString: getDirectDatabaseUrl() })
const prisma = new PrismaClient({ adapter })

function padNum(n: number, width: number) {
  return String(n).padStart(width, '0')
}

async function decodeTokenFromCardJpeg(filePath: string): Promise<string> {
  const { left, top, size } = YC_QR_CARD_BOX
  const { data, info } = await sharp(filePath)
    .extract({ left, top, width: size, height: size })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const code = jsQR(new Uint8ClampedArray(data), info.width, info.height)
  if (!code?.data) {
    throw new Error(`QR tidak terbaca: ${path.relative(process.cwd(), filePath)}`)
  }

  const token = parseParticipantTokenFromQr(code.data)
  if (!token) {
    throw new Error(`Token tidak valid dari QR: ${code.data}`)
  }
  return token
}

async function listPesertaCardFiles(): Promise<string[]> {
  const names = await readdir(PESERTA_DIR)
  return names
    .filter(name => /^\d{3}\.jpg$/i.test(name))
    .sort((a, b) => Number(a.slice(0, 3)) - Number(b.slice(0, 3)))
}

async function decodeAllCards(files: string[]): Promise<QrCardManifestEntry[]> {
  const baseUrl = normalizeQrBaseUrl(resolveQrBaseUrl())
  const entries: QrCardManifestEntry[] = []

  for (const filename of files) {
    const no = Number(filename.slice(0, 3))
    const filePath = path.join(PESERTA_DIR, filename)
    const token = await decodeTokenFromCardJpeg(filePath)
    const file = `/qr/peserta/${filename}`
    entries.push({
      no,
      token,
      url: buildParticipantUrl(baseUrl, token),
      file,
      cardFile: file,
    })
    console.log(`  #${no}: ${token}`)
  }

  return entries
}

async function syncParticipantTokens(entries: QrCardManifestEntry[]) {
  const participants = await prisma.ycParticipant.findMany({
    where: {
      isComitee: false,
      NOT: { token: { startsWith: SMOKE_TOKEN_PREFIX } },
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, token: true, name: true },
  })

  if (participants.length !== entries.length) {
    throw new Error(
      `Jumlah peserta DB (${participants.length}) tidak sama dengan kartu (${entries.length}). ` +
        'Perbaiki dulu sebelum sync token.',
    )
  }

  const finalTokens = new Set(entries.map(e => e.token))
  if (finalTokens.size !== entries.length) {
    throw new Error('Ada token duplikat di kartu peserta.')
  }

  console.log('Memperbarui token peserta di database...')
  await prisma.$transaction(
    async tx => {
      for (let i = 0; i < participants.length; i++) {
        await tx.ycParticipant.update({
          where: { id: participants[i].id },
          data: { token: `__sync-tmp-${padNum(i + 1, 3)}` },
        })
      }

      for (let i = 0; i < participants.length; i++) {
        const entry = entries[i]
        const participant = participants[i]
        await tx.ycParticipant.update({
          where: { id: participant.id },
          data: { token: entry.token },
        })
        const label = participant.name ? `${participant.name} (${participant.token})` : participant.token
        console.log(`  #${entry.no}: ${label} → ${entry.token}`)
      }
    },
    { timeout: 60_000 },
  )
}

async function main() {
  const files = await listPesertaCardFiles()
  if (files.length === 0) {
    throw new Error(`Tidak ada file 001.jpg … di ${PESERTA_DIR}`)
  }

  const baseUrl = normalizeQrBaseUrl(resolveQrBaseUrl())
  console.log(`Sync peserta dari ${files.length} kartu JPG`)
  console.log(`Base URL: ${baseUrl}`)
  console.log('Decode QR...')

  const peserta = await decodeAllCards(files)
  const manifest = await readQrManifest(MANIFEST_PATH)

  await writeQrManifest(MANIFEST_PATH, {
    ...manifest,
    baseUrl,
    generatedAt: new Date().toISOString(),
    template: manifest.template ?? '/qr/1000344557.jpg',
    peserta,
  })

  console.log(`Manifest diperbarui: public/qr/manifest.json (${peserta.length} peserta)`)
  await syncParticipantTokens(peserta)
  console.log('Selesai.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
