import 'dotenv/config'
import { mkdir, rm, writeFile } from 'fs/promises'
import path from 'path'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { nanoid } from 'nanoid'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { getDatabaseUrl } from '../lib/database-url'
import { YC_DEFAULT_PDFS, YC_GROUP_SEED } from '../lib/yc/constants'
import { buildParticipantUrl, normalizeQrBaseUrl, resolveQrBaseUrl } from '../lib/yc/participant-url'
import { TREASURE_HUNT_QUIZ_SEED, treasureHuntFragmentCode } from '../lib/yc/treasure-hunt'

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() })
const prisma = new PrismaClient({ adapter })

const COMITEE_COUNT = 30
const PARTICIPANT_COUNT = 120
const QR_DIR = path.join(process.cwd(), 'public', 'qr')
const TREASURE_HUNT_QR_DIR = path.join(process.cwd(), 'public', 'treasure-hunt')

function padNum(n: number, width: number) {
  return String(n).padStart(width, '0')
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
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

async function main() {
  const baseUrl = normalizeQrBaseUrl(resolveQrBaseUrl())

  console.log('Seeding YC data...')
  console.log(`QR base URL: ${baseUrl}`)

  await prisma.ycNametagStory.deleteMany()
  await prisma.ycNametagPairing.deleteMany()
  await prisma.ycQuizAttempt.deleteMany()
  await prisma.ycQuizVote.deleteMany()
  await prisma.ycTeamReadyCheck.deleteMany()
  await prisma.ycTeamChallengeSession.deleteMany()
  await prisma.ycChallengeSubmission.deleteMany()
  await prisma.ycGalleryUpload.deleteMany()
  await prisma.ycQuizQuestion.deleteMany()
  await prisma.ycChallenge.deleteMany()
  await prisma.ycParticipant.deleteMany()
  await prisma.ycGroup.deleteMany()
  await prisma.ycSetting.deleteMany()

  const groups = await Promise.all(
    YC_GROUP_SEED.map(g =>
      prisma.ycGroup.create({ data: { slug: g.slug, name: g.name, points: 0 } }),
    ),
  )

  const comiteeTokens = Array.from({ length: COMITEE_COUNT }, () => nanoid(16))
  const participantTokens = shuffle(Array.from({ length: PARTICIPANT_COUNT }, () => nanoid(16)))
  const perGroup = PARTICIPANT_COUNT / groups.length

  await prisma.ycParticipant.createMany({
    data: [
      ...comiteeTokens.map(token => ({ token, isComitee: true })),
      ...participantTokens.map((token, i) => ({
        token,
        isComitee: false,
        groupId: groups[i % groups.length].id,
      })),
    ],
  })

  await prisma.ycChallenge.create({
    data: {
      title: 'Tukang Ngonten',
      slug: 'tukang-ngonten',
      type: 'INDIVIDUAL',
      description: 'Ambil foto selfie atau foto kegiatan selama di YC 2026 Wilayah 2 Madiun.',
      points: 20,
      isActive: true,
    },
  })

  await prisma.ycChallenge.create({
    data: {
      title: 'Si Paling Extrovert',
      slug: 'si-paling-extrovert',
      type: 'INDIVIDUAL',
      description:
        'Cerita di Balik Name Tag — scan name tag teman, ngobrol minimal 5 menit, lalu tulis cerita singkat. Poin 50–150 berdasarkan panjang cerita.',
      points: 150,
      isActive: true,
    },
  })

  const teamChallenge = await prisma.ycChallenge.create({
    data: {
      title: 'Perburuan Harta Karun',
      slug: 'treasure-hunt',
      type: 'TEAM',
      description: 'Cari QR Memory Fragment di area explore. Setiap fragment memicu Emergency Meeting dengan 1 soal quiz.',
      points: 200,
      isActive: true,
      quizQuestions: {
        create: TREASURE_HUNT_QUIZ_SEED.map(q => ({
          ...q,
          fragmentQrCode: treasureHuntFragmentCode(q.fragmentOrder),
        })),
      },
    },
  })

  await rm(TREASURE_HUNT_QR_DIR, { recursive: true, force: true })
  await mkdir(TREASURE_HUNT_QR_DIR, { recursive: true })

  const treasureManifest = {
    generatedAt: new Date().toISOString(),
    challengeSlug: teamChallenge.slug,
    fragments: [] as {
      order: number
      code: string
      file: string
      question: string
    }[],
  }

  console.log('Generating treasure-hunt fragment QR codes...')
  for (const q of TREASURE_HUNT_QUIZ_SEED) {
    const code = treasureHuntFragmentCode(q.fragmentOrder)
    const filename = `fragment-${padNum(q.fragmentOrder, 2)}.webp`
    const file = `/treasure-hunt/${filename}`
    await generateQrWebp(code, path.join(TREASURE_HUNT_QR_DIR, filename))
    treasureManifest.fragments.push({
      order: q.fragmentOrder,
      code,
      file,
      question: q.question,
    })
  }
  await writeFile(
    path.join(TREASURE_HUNT_QR_DIR, 'manifest.json'),
    JSON.stringify(treasureManifest, null, 2),
  )

  await prisma.ycSetting.createMany({
    data: [
      { key: 'rundown_pdf_url', value: YC_DEFAULT_PDFS.rundown },
      { key: 'kamar_pdf_url', value: '/yc/docs/kamar.pdf' },
    ],
  })

  await rm(QR_DIR, { recursive: true, force: true })
  const panitiaDir = path.join(QR_DIR, 'panitia')
  const pesertaDir = path.join(QR_DIR, 'peserta')
  await mkdir(panitiaDir, { recursive: true })
  await mkdir(pesertaDir, { recursive: true })

  console.log('Generating QR codes...')

  const manifest = {
    baseUrl,
    generatedAt: new Date().toISOString(),
    panitia: [] as { no: number; token: string; url: string; file: string }[],
    peserta: [] as { no: number; token: string; url: string; file: string }[],
  }

  for (let i = 0; i < comiteeTokens.length; i++) {
    const no = i + 1
    const token = comiteeTokens[i]
    const url = buildParticipantUrl(baseUrl, token)
    const file = `/qr/panitia/${padNum(no, 2)}.webp`
    await generateQrWebp(url, path.join(panitiaDir, `${padNum(no, 2)}.webp`))
    manifest.panitia.push({ no, token, url, file })
  }

  for (let i = 0; i < participantTokens.length; i++) {
    const no = i + 1
    const token = participantTokens[i]
    const url = buildParticipantUrl(baseUrl, token)
    const file = `/qr/peserta/${padNum(no, 3)}.webp`
    await generateQrWebp(url, path.join(pesertaDir, `${padNum(no, 3)}.webp`))
    manifest.peserta.push({ no, token, url, file })
  }

  await writeFile(path.join(QR_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))

  console.log(`Kelompok: ${YC_GROUP_SEED.length} (ikon: public/group-icon/{slug}.jpg)`)
  console.log('YC seed complete.')
  console.log(`Panitia: ${COMITEE_COUNT} (tanpa nama, is_comitee=true)`)
  console.log(`Peserta: ${PARTICIPANT_COUNT} (acak ke ${groups.length} kelompok, ~${perGroup}/kelompok)`)
  console.log(`QR files: public/qr/panitia/*.webp, public/qr/peserta/*.webp`)
  console.log(`Manifest: public/qr/manifest.json`)
  console.log('Sample panitia token:', comiteeTokens[0])
  console.log('Sample peserta token:', participantTokens[0])
  console.log('Team challenge slug:', teamChallenge.slug)
  console.log(`Treasure-hunt QR: public/treasure-hunt/fragment-01.webp … fragment-08.webp`)
  console.log('Treasure-hunt manifest: public/treasure-hunt/manifest.json')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
