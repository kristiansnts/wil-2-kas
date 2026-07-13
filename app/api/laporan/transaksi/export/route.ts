import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

const numFmt = '#,##0'

function styleNum(cell: ExcelJS.Cell) {
  cell.numFmt = numFmt
  cell.alignment = { horizontal: 'right' }
}

function styleHeader(cell: ExcelJS.Cell) {
  cell.font = { bold: true }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.border = {
    top: { style: 'thin' }, bottom: { style: 'thin' },
    left: { style: 'thin' }, right: { style: 'thin' },
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  const sp = req.nextUrl.searchParams
  const from = sp.get('from') ?? ''
  const to = sp.get('to') ?? ''
  const eventId = sp.get('eventId')
  const type = sp.get('type') // all | masuk | keluar
  const scope = sp.get('scope') // all | umum | divisi
  const divisionId = sp.get('divisionId')
  const includeDK = sp.get('includeDK') !== '0'
  const search = (sp.get('search') ?? '').trim().toLowerCase()

  // Division users can only export their own kas
  const forcedDivisionId = session.role === 'division' ? session.divisionId : null

  const where: {
    scope?: 'umum' | 'divisi'
    divisionId?: string
    eventId?: string
    type?: 'masuk' | 'keluar'
    date?: { gte?: Date; lte?: Date }
  } = {}

  if (forcedDivisionId) {
    where.scope = 'divisi'
    where.divisionId = forcedDivisionId
  } else if (divisionId && divisionId !== 'all') {
    if (divisionId === 'umum') {
      where.scope = 'umum'
    } else {
      where.scope = 'divisi'
      where.divisionId = divisionId
    }
  } else if (scope === 'umum' || scope === 'divisi') {
    where.scope = scope
  }

  if (eventId && eventId !== 'all') where.eventId = eventId
  if (type === 'masuk' || type === 'keluar') where.type = type

  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(`${from}T00:00:00.000Z`)
    if (to) where.date.lte = new Date(`${to}T23:59:59.999Z`)
  }

  const txns = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'asc' },
    include: {
      event: { select: { name: true } },
      division: { select: { name: true } },
    },
  })

  const isDK = (desc: string) => desc.startsWith('Persepuluhan ') || desc.startsWith('Wadah ')
  const rows = txns.filter(t => {
    if (!includeDK && isDK(t.desc)) return false
    if (search && !t.desc.toLowerCase().includes(search)) return false
    return true
  })

  let eventName: string | null = null
  if (eventId && eventId !== 'all') {
    eventName = rows[0]?.event?.name
      ?? (await prisma.event.findUnique({ where: { id: eventId }, select: { name: true } }))?.name
      ?? null
  }

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Laporan')
  ws.columns = [
    { key: 'no', width: 6 },
    { key: 'desc', width: 45 },
    { key: 'masuk', width: 16 },
    { key: 'keluar', width: 16 },
  ]

  const title = eventName
    ? `LAPORAN EVENT — ${eventName}`
    : from && to
      ? `LAPORAN TRANSAKSI ${from} s/d ${to}`
      : 'LAPORAN TRANSAKSI'

  const r1 = ws.addRow([title, '', '', ''])
  ws.mergeCells(`A${r1.number}:D${r1.number}`)
  r1.getCell(1).font = { bold: true, size: 12 }
  r1.getCell(1).alignment = { horizontal: 'center' }
  ws.addRow([])

  const hr = ws.addRow(['No', 'Deskripsi', 'Pemasukan', 'Pengeluaran'])
  hr.eachCell(c => styleHeader(c))

  let totalMasuk = 0
  let totalKeluar = 0

  rows.forEach((t, i) => {
    const masuk = t.type === 'masuk' ? t.amount : 0
    const keluar = t.type === 'keluar' ? t.amount : 0
    totalMasuk += masuk
    totalKeluar += keluar
    const row = ws.addRow([
      i + 1,
      t.desc,
      masuk || '',
      keluar || '',
    ])
    if (masuk) styleNum(row.getCell(3))
    if (keluar) styleNum(row.getCell(4))
  })

  ws.addRow([])
  const totalRow = ws.addRow(['', 'TOTAL', totalMasuk, totalKeluar])
  totalRow.font = { bold: true }
  styleNum(totalRow.getCell(3))
  styleNum(totalRow.getCell(4))

  const saldo = totalMasuk - totalKeluar
  const saldoRow = ws.addRow(['', 'SISA SALDO', saldo, ''])
  saldoRow.font = { bold: true }
  styleNum(saldoRow.getCell(3))
  ws.mergeCells(`C${saldoRow.number}:D${saldoRow.number}`)

  const buf = await wb.xlsx.writeBuffer()
  const slug = eventName
    ? `event-${eventName.replace(/\s+/g, '-').toLowerCase().slice(0, 40)}`
    : from && to
      ? `${from}_${to}`
      : 'semua'
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="laporan-${slug}.xlsx"`,
    },
  })
}
