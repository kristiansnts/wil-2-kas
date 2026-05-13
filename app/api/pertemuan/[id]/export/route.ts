import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const TITLE_LABEL: Record<string, string> = { pdp: 'PDP', pdm: 'PDM', pdt: 'PDT' }

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return `${MONTHS_ID[parseInt(m) - 1]} ${y}`
}

function parseSession(val: string | undefined) {
  if (!val) return null
  try { return JSON.parse(decodeURIComponent(val)) } catch { return null }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  const session = parseSession(cookieStore.get('kas-session')?.value)
  if (!session || session.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      submissions: {
        include: {
          pastor: true,
          wadahEntries: true,
        },
        orderBy: { submittedAt: 'asc' },
      },
    },
  })
  if (!meeting) return new NextResponse('Not found', { status: 404 })

  const divisions = await prisma.division.findMany({ orderBy: { name: 'asc' } })

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(`Pertemuan ${fmtMonth(meeting.month)}`)

  const divCols = divisions.map(d => d.name.toUpperCase())
  ws.columns = [
    { header: 'NO', key: 'no', width: 5 },
    { header: 'NAMA', key: 'nama', width: 24 },
    { header: 'TITLE', key: 'title', width: 8 },
    { header: 'PELAYANAN', key: 'pelayanan', width: 20 },
    { header: 'PERSEPULUHAN', key: 'persepuluhan', width: 16 },
    ...divisions.map(d => ({ header: d.name.toUpperCase(), key: d.id, width: 14 })),
    { header: 'KET (BLN)', key: 'bulan', width: 10 },
    { header: 'STATUS', key: 'status', width: 12 },
  ]

  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9E1F2' },
  }

  meeting.submissions.forEach((sub, i) => {
    const divAmounts: Record<string, number> = {}
    for (const w of sub.wadahEntries) divAmounts[w.divisionId] = w.amount

    ws.addRow({
      no: i + 1,
      nama: sub.pastor.name,
      title: TITLE_LABEL[sub.pastor.title] ?? sub.pastor.title.toUpperCase(),
      pelayanan: sub.pastor.pelayanan ?? '',
      persepuluhan: sub.persepuluhan,
      ...Object.fromEntries(divisions.map(d => [d.id, divAmounts[d.id] ?? 0])),
      bulan: sub.bulan,
      status: sub.status === 'approved' ? 'Disetujui' : 'Pending',
    })
  })

  const buffer = await wb.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="pertemuan-${meeting.month}.xlsx"`,
    },
  })
}
