import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const MONTHS_FULL: Record<string, string> = {
  '01': 'JANUARI', '02': 'FEBRUARI', '03': 'MARET', '04': 'APRIL',
  '05': 'MEI', '06': 'JUNI', '07': 'JULI', '08': 'AGUSTUS',
  '09': 'SEPTEMBER', '10': 'OKTOBER', '11': 'NOVEMBER', '12': 'DESEMBER',
}
const TITLE_LABEL: Record<string, string> = { pdp: 'Pdp', pdm: 'Pdm', pdt: 'Pdt' }
const DIV_PRIORITY = ['PRIA', 'WANITA', 'PELPRAP', 'PELNAP', 'PELAHT', 'PENGINJILAN', 'DIAKONIA', 'DANA']

function parseSession(val: string | undefined) {
  if (!val) return null
  try { return JSON.parse(decodeURIComponent(val)) } catch { return null }
}

function divSortKey(name: string) {
  const u = name.toUpperCase()
  const i = DIV_PRIORITY.findIndex(k => u.includes(k))
  return i === -1 ? 99 : i
}

function divShortLabel(name: string) {
  const u = name.toUpperCase()
  if (u.includes('PRIA')) return 'WADAH\nPRIA'
  if (u.includes('WANITA')) return 'WADAH\nWANITA'
  if (u.includes('PELPRAP')) return 'WADAH\nPELPRAP'
  if (u.includes('PELNAP')) return 'WADAH\nPELNAP'
  if (u.includes('PELAHT')) return 'WADAH PELAHT'
  if (u.includes('PENGINJILAN')) return 'PENGINJILAN'
  if (u.includes('DIAKONIA')) return 'DIAKONIA'
  if (u.includes('DANA')) return 'DN. KESEJAH'
  return name
}

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

function colLetter(n: number) { return String.fromCharCode(64 + n) } // 1→A, 14→N

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  const session = parseSession(cookieStore.get('kas-session')?.value)
  if (!session || session.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params
  const type = req.nextUrl.searchParams.get('type') ?? 'md'

  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      submissions: {
        include: { pastor: true, wadahEntries: true },
        orderBy: [{ pastor: { name: 'asc' } }],
      },
      setorItems: { orderBy: { id: 'asc' } },
    },
  })
  if (!meeting) return new NextResponse('Not found', { status: 404 })

  const [y, m] = meeting.month.split('-')
  const monthLabel = `${MONTHS_FULL[m] ?? m} ${y}`

  // ─── DANA KESEJAHTERAAN ───────────────────────────────────────────────────
  if (type === 'kesehatan') {
    const kesehatanDiv = await prisma.division.findFirst({
      where: { name: { contains: 'DANA', mode: 'insensitive' } },
    })

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Dana Kesejahteraan')
    ws.columns = [
      { key: 'no', width: 6 }, { key: 'nama', width: 38 },
      { key: 'pelayanan', width: 22 }, { key: 'amount', width: 16 }, { key: 'ket', width: 10 },
    ]

    const r1 = ws.addRow(['DANA KESEJAHTERAAN HAMBA-HAMBA TUHAN', '', '', '', ''])
    ws.mergeCells(`A${r1.number}:E${r1.number}`)
    r1.getCell(1).font = { bold: true, size: 12 }
    r1.getCell(1).alignment = { horizontal: 'center' }

    const r2 = ws.addRow([`GPdI WILAYAH II MADIUN BULAN ${monthLabel}`, '', '', '', ''])
    ws.mergeCells(`A${r2.number}:E${r2.number}`)
    r2.getCell(1).font = { bold: true, size: 11 }
    r2.getCell(1).alignment = { horizontal: 'center' }
    ws.addRow([])

    const hr = ws.addRow(['NO.', 'NAMA HAMBA-HAMBA TUHAN', 'PELAYANAN', 'DANA\nKESEJAHTERAAN', 'Ket'])
    hr.font = { bold: true }; hr.height = 36
    hr.eachCell(cell => styleHeader(cell))

    let total = 0
    meeting.submissions.forEach((sub, i) => {
      const title = TITLE_LABEL[sub.pastor.title] ?? ''
      const nameStr = title ? `${sub.pastor.name}, ${title}` : sub.pastor.name
      const amount = kesehatanDiv
        ? (sub.wadahEntries.find(w => w.divisionId === kesehatanDiv.id)?.amount ?? 0)
        : 0
      const ket = sub.bulan > 1 ? `${sub.bulan} BLN` : ''
      const row = ws.addRow([i + 1, nameStr, sub.pastor.pelayanan ?? '', amount || '', ket])
      if (amount) { styleNum(row.getCell(4)) }
      total += amount
    })

    ws.addRow([])
    const totalRow = ws.addRow(['', 'TOTAL PERSEMBAHAN', '', total, ''])
    totalRow.font = { bold: true }; styleNum(totalRow.getCell(4))

    ws.addRow([])
    const dateStr = meeting.setorDate
      ? new Date(meeting.setorDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '_______________'
    ws.addRow(['', '', '', `Madiun, ${dateStr}`, ''])
    ws.addRow(['', '', '', 'BENDAHARA WIL II MADIUN', ''])
    ws.addRow([]); ws.addRow([]); ws.addRow([])

    const buf = await wb.xlsx.writeBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="kesejahteraan-${meeting.month}.xlsx"`,
      },
    })
  }

  // ─── PERSEPULUHAN MD ───────────────────────────────────────────────────────
  if (type === 'md') {
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Persepuluhan')
    ws.columns = [
      { key: 'no', width: 6 }, { key: 'nama', width: 38 },
      { key: 'pelayanan', width: 22 }, { key: 'persepuluhan', width: 16 }, { key: 'ket', width: 10 },
    ]

    const r1 = ws.addRow(['PERSEPULUHAN HAMBA-HAMBA TUHAN', '', '', '', ''])
    ws.mergeCells(`A${r1.number}:E${r1.number}`)
    r1.getCell(1).font = { bold: true, size: 12 }; r1.getCell(1).alignment = { horizontal: 'center' }

    const r2 = ws.addRow([`GPdI WILAYAH II MADIUN BULAN ${monthLabel}`, '', '', '', ''])
    ws.mergeCells(`A${r2.number}:E${r2.number}`)
    r2.getCell(1).font = { bold: true, size: 11 }; r2.getCell(1).alignment = { horizontal: 'center' }
    ws.addRow([])

    const hr = ws.addRow(['NO.', 'NAMA HAMBA-HAMBA TUHAN', 'PELAYANAN', 'PERSEPULUHAN', 'Ket'])
    hr.font = { bold: true }; hr.height = 28
    hr.eachCell(cell => styleHeader(cell))

    const subs = meeting.submissions
    const total = subs.reduce((s, sub) => s + sub.persepuluhan, 0)

    subs.forEach((sub, i) => {
      const title = TITLE_LABEL[sub.pastor.title] ?? ''
      const nameStr = title ? `${sub.pastor.name}, ${title}` : sub.pastor.name
      const row = ws.addRow([i + 1, nameStr, sub.pastor.pelayanan ?? '', sub.persepuluhan, sub.bulan > 1 ? `${sub.bulan} BLN` : ''])
      styleNum(row.getCell(4))
    })

    ws.addRow([])
    const totalRow = ws.addRow(['', 'TOTAL PERSEMBAHAN', '', total, ''])
    totalRow.font = { bold: true }; styleNum(totalRow.getCell(4))

    const pct15 = Math.round(total * 0.15)
    const pct85 = Math.round(total * 0.85)

    ws.addRow([])
    const r15 = ws.addRow(['', '15% KAS WILAYAH II MADIUN', '', pct15, ''])
    styleNum(r15.getCell(4))

    ws.addRow([])
    const r85 = ws.addRow(['', '85% KAS MD', '', pct85, ''])
    r85.font = { bold: true }; styleNum(r85.getCell(4))

    for (const item of meeting.setorItems) {
      const itemRow = ws.addRow(['', item.desc, '', item.amount, ''])
      styleNum(itemRow.getCell(4))
    }

    const netSetor = meeting.setorNetAmount ?? (pct85 - meeting.setorItems.reduce((s, i) => s + i.amount, 0))
    const setorRow = ws.addRow(['', 'SETOR KAS MAJELIS DAERAH', '', netSetor, ''])
    setorRow.font = { bold: true }; styleNum(setorRow.getCell(4))

    ws.addRow([])
    const dateStr = meeting.setorDate
      ? new Date(meeting.setorDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '_______________'
    ws.addRow(['', '', '', `Madiun, ${dateStr}`, ''])
    ws.addRow(['', '', '', 'BENDAHARA WIL II MADIUN', ''])
    ws.addRow([]); ws.addRow([]); ws.addRow([])

    const buf = await wb.xlsx.writeBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="pertemuan-${meeting.month}.xlsx"`,
      },
    })
  }

  // ─── LAPORAN LENGKAP (type === 'all') ─────────────────────────────────────
  const monthStart = new Date(`${y}-${m}-01T00:00:00.000Z`)
  const nextMonthStart = new Date(Date.UTC(parseInt(y), parseInt(m), 1))

  const [allPastors, allDivisions, kasUmumRec, kasUmumTxns, divTxns] = await Promise.all([
    prisma.pastor.findMany({ where: { status: 'active' }, orderBy: { name: 'asc' } }),
    prisma.division.findMany(),
    prisma.kasUmum.findFirst(),
    prisma.transaction.findMany({
      where: { scope: 'umum', date: { gte: monthStart, lt: nextMonthStart } },
      orderBy: { date: 'asc' },
    }),
    prisma.transaction.findMany({
      where: { scope: 'divisi', date: { gte: monthStart, lt: nextMonthStart } },
      orderBy: { date: 'asc' },
    }),
  ])

  const sortedDivs = [...allDivisions].sort((a, b) => divSortKey(a.name) - divSortKey(b.name))
  const divCount = sortedDivs.length

  // submission map: pastorId → { persepuluhan, bulan, wadah }
  const subMap = new Map<string, { persepuluhan: number; bulan: number; wadah: Map<string, number> }>()
  for (const sub of meeting.submissions) {
    const wadah = new Map<string, number>()
    for (const w of sub.wadahEntries) wadah.set(w.divisionId, w.amount)
    subMap.set(sub.pastorId, { persepuluhan: sub.persepuluhan, bulan: sub.bulan, wadah })
  }

  // Total cols: NO + NAMA + PELAYANAN + PERSEPULUHAN + 8divs + JUMLAH + KET = 14
  const totalCols = 4 + divCount + 2
  const lastCol = colLetter(totalCols)
  const jumlahCol = colLetter(3 + divCount + 1) // D + divCount = col for JUMLAH
  const ketCol = colLetter(4 + divCount + 1)    // KET column

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Laporan Lengkap')

  ws.columns = [
    { key: 'no', width: 6 },
    { key: 'nama', width: 35 },
    { key: 'pelayanan', width: 20 },
    { key: 'persepu', width: 14 },
    ...sortedDivs.map(() => ({ width: 12 })),
    { key: 'jumlah', width: 14 },
    { key: 'ket', width: 10 },
  ]

  // Title rows
  const r1 = ws.addRow(['PERSEPULUHAN HAMBA-HAMBA TUHAN', ...Array(totalCols - 1).fill('')])
  ws.mergeCells(`A${r1.number}:${lastCol}${r1.number}`)
  r1.getCell(1).font = { bold: true, size: 12 }; r1.getCell(1).alignment = { horizontal: 'center' }

  const r2 = ws.addRow([`GPdI WILAYAH II MADIUN BULAN ${monthLabel}`, ...Array(totalCols - 1).fill('')])
  ws.mergeCells(`A${r2.number}:${lastCol}${r2.number}`)
  r2.getCell(1).font = { bold: true, size: 11 }; r2.getCell(1).alignment = { horizontal: 'center' }
  ws.addRow([])

  // Two-row header
  function addMainHeader() {
    const hRow = ws.addRow([
      'NO.', 'NAMA\nHAMBA-HAMBA TUHAN', 'PELAYANAN',
      'JENIS PERSEMBAHAN', ...Array(divCount + 1).fill(''),
      'KET', '',
    ])
    const hRowN = hRow.number
    ws.mergeCells(`A${hRowN}:A${hRowN + 1}`)
    ws.mergeCells(`B${hRowN}:B${hRowN + 1}`)
    ws.mergeCells(`C${hRowN}:C${hRowN + 1}`)
    ws.mergeCells(`D${hRowN}:${jumlahCol}${hRowN}`)
    ws.mergeCells(`${ketCol}${hRowN}:${ketCol}${hRowN + 1}`)
    hRow.eachCell(cell => styleHeader(cell)); hRow.height = 28

    const hRow2 = ws.addRow([
      '', '', '', 'PERSEPULUHAN',
      ...sortedDivs.map(d => divShortLabel(d.name)),
      'JUMLAH', '',
    ])
    hRow2.eachCell(cell => styleHeader(cell)); hRow2.height = 40
  }

  addMainHeader()

  // Column totals tracking
  const colTotals = new Array(divCount + 2).fill(0) // [persepuluhan, div0..divN, jumlah]

  function addPastorRow(no: number, nameStr: string, pelayanan: string, persepuluhan: number, wadah: Map<string, number>, bulan: number) {
    const divAmounts = sortedDivs.map(d => wadah.get(d.id) ?? 0)
    const rowTotal = persepuluhan + divAmounts.reduce((s, a) => s + a, 0)
    const row = ws.addRow([
      no, nameStr, pelayanan,
      persepuluhan || '',
      ...divAmounts.map(a => a || ''),
      rowTotal || '',
      bulan > 1 ? `${bulan} BLN` : '',
    ])
    if (persepuluhan) styleNum(row.getCell(4))
    divAmounts.forEach((a, i) => { if (a) styleNum(row.getCell(5 + i)) })
    if (rowTotal) styleNum(row.getCell(5 + divCount))

    colTotals[0] += persepuluhan
    divAmounts.forEach((a, i) => { colTotals[i + 1] += a })
    colTotals[divCount + 1] += rowTotal
  }

  function addTotalsRow(label: string, totals: number[], bold = true) {
    const row = ws.addRow(['', label, '', ...totals.map(t => t || ''), ''])
    if (bold) row.font = { bold: true }
    totals.forEach((t, i) => { if (t) styleNum(row.getCell(4 + i)) })
    return row
  }

  allPastors.forEach((pastor, i) => {
    const no = i + 1
    const sub = subMap.get(pastor.id)
    const title = TITLE_LABEL[pastor.title] ?? ''
    const nameStr = title ? `${pastor.name}, ${title}` : pastor.name

    addPastorRow(no, nameStr, pastor.pelayanan ?? '', sub?.persepuluhan ?? 0, sub?.wadah ?? new Map(), sub?.bulan ?? 1)
  })

  ws.addRow([])
  addTotalsRow('TOTAL PERSEMBAHAN', [...colTotals])

  ws.addRow([])
  ws.addRow([])

  // Repeat header + TOTAL PEMINDAHAN
  addMainHeader()
  addTotalsRow('TOTAL PEMINDAHAN', [...colTotals])

  ws.addRow([])
  ws.addRow([])

  // ── PEMBIAYAAN ──
  const pct85 = Math.round(colTotals[0] * 0.85)
  const pemRow = ws.addRow([
    'P E M B I A Y A A N', '1.  SETOR MD 85%', '', pct85,
    ...Array(divCount + 2).fill(''),
  ])
  pemRow.font = { bold: true }; styleNum(pemRow.getCell(4))

  for (const item of meeting.setorItems) {
    const r = ws.addRow(['', item.desc, '', item.amount, ...Array(divCount + 2).fill('')])
    styleNum(r.getCell(4))
  }

  ws.addRow([])
  ws.addRow([])

  // ── LAPORAN KEUANGAN WILAYAH ──
  const lapTitleRow = ws.addRow([
    '', 'LAPORAN KEUANGAN WILAYAH :', '', ...Array(divCount + 3).fill('')
  ])
  lapTitleRow.font = { bold: true }

  // Compute previous balances
  const kasBalance = kasUmumRec?.balance ?? 0
  const kasMasuk = kasUmumTxns.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0)
  const kasKeluar = kasUmumTxns.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
  const kasPrev = kasBalance - kasMasuk + kasKeluar

  const divPrev = sortedDivs.map(div => {
    const txns = divTxns.filter(t => t.divisionId === div.id)
    const masuk = txns.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0)
    const keluar = txns.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
    return div.balance - masuk + keluar
  })
  // JUMLAH = KAS WIL + all divs except last (DN.KESEJAH)
  const prevJumlah = kasPrev + divPrev.slice(0, divCount - 1).reduce((s, b) => s + b, 0)

  const saldoPrevRow = ws.addRow([
    '', 'Saldo Kas Wilayah Bulan Lalu', '', kasPrev, ...divPrev, prevJumlah, '',
  ])
  styleNum(saldoPrevRow.getCell(4))
  divPrev.forEach((_, i) => styleNum(saldoPrevRow.getCell(5 + i)))
  styleNum(saldoPrevRow.getCell(5 + divCount))

  ws.addRow([])

  // PENERIMAAN
  const pen15 = kasUmumTxns.filter(t => t.type === 'masuk' && t.desc.startsWith('Persepuluhan')).reduce((s, t) => s + t.amount, 0)
  const kolekte = kasUmumTxns.filter(t => t.type === 'masuk' && !t.desc.startsWith('Persepuluhan')).reduce((s, t) => s + t.amount, 0)
  const jumlahPen = pen15 + kolekte

  ws.addRow(['', '2.  PENERIMAAN', '', ...Array(divCount + 3).fill('')]).font = { bold: true }

  const rPen15 = ws.addRow(['', '      A. PENERIMAAN 15%', '', pen15, ...Array(divCount + 2).fill('')])
  styleNum(rPen15.getCell(4))

  if (kolekte > 0) {
    const rKol = ws.addRow(['', 'B. KOLEKTE', '', kolekte, ...Array(divCount + 2).fill('')])
    styleNum(rKol.getCell(4))
  }

  const rJumPen = ws.addRow(['', 'JUMLAH', '', jumlahPen, ...Array(divCount + 2).fill('')])
  rJumPen.font = { bold: true }; styleNum(rJumPen.getCell(4))

  ws.addRow([])

  // PENGELUARAN
  ws.addRow(['', '3.  PENGELUARAN KAS', '', ...Array(divCount + 3).fill('')]).font = { bold: true }

  // KasUmum keluar
  for (const txn of kasUmumTxns.filter(t => t.type === 'keluar')) {
    const r = ws.addRow(['', `-  ${txn.desc}`, '', txn.amount, ...Array(divCount + 2).fill('')])
    styleNum(r.getCell(4))
  }

  // Per-division keluar:
  // - DIAKONIA: always its own row
  // - Others: group same desc into one row across division columns
  const diakoniaIdx = sortedDivs.findIndex(d => d.name.toUpperCase().includes('DIAKONIA'))
  const diakoniaId = diakoniaIdx !== -1 ? sortedDivs[diakoniaIdx].id : null

  const diakoniaKeluar = divTxns.filter(t => t.type === 'keluar' && t.divisionId === diakoniaId)
  for (const txn of diakoniaKeluar) {
    const amounts = Array(divCount + 2).fill('')
    amounts[diakoniaIdx + 1] = txn.amount
    const r = ws.addRow(['', `-  ${txn.desc}`, '', ...amounts, ''])
    styleNum(r.getCell(5 + diakoniaIdx))
  }

  const groupedKeluar = new Map<string, Map<number, number>>() // desc → divIdx → amount
  for (const txn of divTxns.filter(t => t.type === 'keluar' && t.divisionId !== diakoniaId)) {
    const i = sortedDivs.findIndex(d => d.id === txn.divisionId)
    if (i === -1) continue
    if (!groupedKeluar.has(txn.desc)) groupedKeluar.set(txn.desc, new Map())
    const m = groupedKeluar.get(txn.desc)!
    m.set(i, (m.get(i) ?? 0) + txn.amount)
  }
  for (const [desc, divAmounts] of groupedKeluar) {
    const amounts = Array(divCount + 2).fill('')
    for (const [i, amount] of divAmounts) amounts[i + 1] = amount
    const r = ws.addRow(['', `-  ${desc}`, '', ...amounts, ''])
    for (const [i] of divAmounts) styleNum(r.getCell(5 + i))
  }

  // JUMLAH PENGELUARAN
  const kasKeluarTotal = kasUmumTxns.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
  const divKeluarTotals = sortedDivs.map(div =>
    divTxns.filter(t => t.divisionId === div.id && t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
  )
  const keluarJumlah = kasKeluarTotal + divKeluarTotals.slice(0, divCount - 1).reduce((s, a) => s + a, 0)

  const rJumKel = ws.addRow([
    '', 'JUMLAH PENGELUARAN', '', kasKeluarTotal, ...divKeluarTotals, keluarJumlah, '',
  ])
  rJumKel.font = { bold: true }
  styleNum(rJumKel.getCell(4))
  divKeluarTotals.forEach((_, i) => styleNum(rJumKel.getCell(5 + i)))
  styleNum(rJumKel.getCell(5 + divCount))

  ws.addRow([])

  // SALDO BULAN INI (current DB balances = source of truth)
  const divCurr = sortedDivs.map(d => d.balance)
  const currJumlah = kasBalance + divCurr.slice(0, divCount - 1).reduce((s, b) => s + b, 0)

  const rSaldo = ws.addRow([
    '', 'SALDO KAS WILAYAH BULAN INI', '', kasBalance, ...divCurr, currJumlah, '',
  ])
  rSaldo.font = { bold: true }
  styleNum(rSaldo.getCell(4))
  divCurr.forEach((_, i) => styleNum(rSaldo.getCell(5 + i)))
  styleNum(rSaldo.getCell(5 + divCount))

  const buf = await wb.xlsx.writeBuffer()
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="laporan-${meeting.month}.xlsx"`,
    },
  })
}
