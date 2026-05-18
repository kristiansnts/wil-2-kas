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

function colLetter(n: number) { return String.fromCharCode(64 + n) }

function fmtSetorDate(d: string | Date | null): string {
  if (!d) return '_______________'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const session = parseSession(cookieStore.get('kas-session')?.value)
  if (!session || session.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const meetingId = req.nextUrl.searchParams.get('meetingId')
  if (!meetingId) return new NextResponse('Missing meetingId', { status: 400 })

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
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

  const [allDivisions, kasUmumRec, kasUmumTxns, divTxns] = await Promise.all([
    prisma.division.findMany(),
    prisma.kasUmum.findFirst(),
    prisma.transaction.findMany({
      where: {
        scope: 'umum',
        date: { gte: new Date(`${y}-${m}-01T00:00:00.000Z`), lt: new Date(Date.UTC(parseInt(y), parseInt(m), 1)) },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.transaction.findMany({
      where: {
        scope: 'divisi',
        date: { gte: new Date(`${y}-${m}-01T00:00:00.000Z`), lt: new Date(Date.UTC(parseInt(y), parseInt(m), 1)) },
      },
      orderBy: { date: 'asc' },
    }),
  ])

  const sortedDivs = [...allDivisions].sort((a, b) => divSortKey(a.name) - divSortKey(b.name))
  const divCount = sortedDivs.length
  const kesehatanDiv = sortedDivs.find(d => d.name.toUpperCase().includes('DANA'))

  const subMap = new Map<string, { persepuluhan: number; bulan: number; wadah: Map<string, number> }>()
  for (const sub of meeting.submissions) {
    const wadah = new Map<string, number>()
    for (const w of sub.wadahEntries) wadah.set(w.divisionId, w.amount)
    subMap.set(sub.pastorId, { persepuluhan: sub.persepuluhan, bulan: sub.bulan, wadah })
  }

  const wb = new ExcelJS.Workbook()

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 1 — LAPORAN LENGKAP
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const totalCols = 4 + divCount + 2
    const lastCol = colLetter(totalCols)
    const jumlahCol = colLetter(3 + divCount + 1)
    const ketCol = colLetter(4 + divCount + 1)

    const ws = wb.addWorksheet('Laporan Lengkap')
    ws.columns = [
      { key: 'no', width: 6 }, { key: 'nama', width: 35 }, { key: 'pelayanan', width: 20 },
      { key: 'persepu', width: 14 }, ...sortedDivs.map(() => ({ width: 12 })),
      { key: 'jumlah', width: 14 }, { key: 'ket', width: 10 },
    ]

    const r1 = ws.addRow(['PERSEPULUHAN HAMBA-HAMBA TUHAN', ...Array(totalCols - 1).fill('')])
    ws.mergeCells(`A${r1.number}:${lastCol}${r1.number}`)
    r1.getCell(1).font = { bold: true, size: 12 }; r1.getCell(1).alignment = { horizontal: 'center' }

    const r2 = ws.addRow([`GPdI WILAYAH II MADIUN BULAN ${monthLabel}`, ...Array(totalCols - 1).fill('')])
    ws.mergeCells(`A${r2.number}:${lastCol}${r2.number}`)
    r2.getCell(1).font = { bold: true, size: 11 }; r2.getCell(1).alignment = { horizontal: 'center' }
    ws.addRow([])

    function addMainHeader() {
      const hRow = ws.addRow([
        'NO.', 'NAMA\nHAMBA-HAMBA TUHAN', 'PELAYANAN',
        'JENIS PERSEMBAHAN', ...Array(divCount + 1).fill(''), 'KET', '',
      ])
      const n = hRow.number
      ws.mergeCells(`A${n}:A${n + 1}`); ws.mergeCells(`B${n}:B${n + 1}`)
      ws.mergeCells(`C${n}:C${n + 1}`); ws.mergeCells(`D${n}:${jumlahCol}${n}`)
      ws.mergeCells(`${ketCol}${n}:${ketCol}${n + 1}`)
      hRow.eachCell(c => styleHeader(c)); hRow.height = 28

      const hRow2 = ws.addRow(['', '', '', 'PERSEPULUHAN', ...sortedDivs.map(d => divShortLabel(d.name)), 'JUMLAH', ''])
      hRow2.eachCell(c => styleHeader(c)); hRow2.height = 40
    }

    addMainHeader()

    const colTotals = new Array(divCount + 2).fill(0)

    meeting.submissions.forEach((sub, i) => {
      const title = TITLE_LABEL[sub.pastor.title] ?? ''
      const nameStr = title ? `${sub.pastor.name}, ${title}` : sub.pastor.name
      const divAmounts = sortedDivs.map(d => sub.wadahEntries.find(w => w.divisionId === d.id)?.amount ?? 0)
      const rowTotal = sub.persepuluhan + divAmounts.reduce((s, a) => s + a, 0)
      const row = ws.addRow([
        i + 1, nameStr, sub.pastor.pelayanan ?? '',
        sub.persepuluhan || '',
        ...divAmounts.map(a => a || ''),
        rowTotal || '',
        sub.bulan > 1 ? `${sub.bulan} BLN` : '',
      ])
      if (sub.persepuluhan) styleNum(row.getCell(4))
      divAmounts.forEach((a, j) => { if (a) styleNum(row.getCell(5 + j)) })
      if (rowTotal) styleNum(row.getCell(5 + divCount))
      colTotals[0] += sub.persepuluhan
      divAmounts.forEach((a, j) => { colTotals[j + 1] += a })
      colTotals[divCount + 1] += rowTotal
    })

    ws.addRow([])
    const totalRow = ws.addRow(['', 'TOTAL PERSEMBAHAN', '', ...colTotals.map(t => t || '')])
    totalRow.font = { bold: true }
    colTotals.forEach((t, i) => { if (t) styleNum(totalRow.getCell(4 + i)) })

    ws.addRow([]); ws.addRow([])
    addMainHeader()
    const pemRow = ws.addRow(['', 'TOTAL PEMINDAHAN', '', ...colTotals.map(t => t || '')])
    pemRow.font = { bold: true }
    colTotals.forEach((t, i) => { if (t) styleNum(pemRow.getCell(4 + i)) })

    ws.addRow([]); ws.addRow([])

    // PEMBIAYAAN
    const pct85 = Math.round(colTotals[0] * 0.85)
    const pemBiayaRow = ws.addRow(['P E M B I A Y A A N', '1.  SETOR MD 85%', '', pct85, ...Array(divCount + 2).fill('')])
    pemBiayaRow.font = { bold: true }; styleNum(pemBiayaRow.getCell(4))
    for (const item of meeting.setorItems) {
      const r = ws.addRow(['', item.desc, '', item.amount, ...Array(divCount + 2).fill('')]); styleNum(r.getCell(4))
    }

    ws.addRow([]); ws.addRow([])

    // LAPORAN KEUANGAN WILAYAH
    ws.addRow(['', 'LAPORAN KEUANGAN WILAYAH :', ...Array(divCount + 3).fill('')]).font = { bold: true }

    const kasBalance = kasUmumRec?.balance ?? 0
    const kasMasuk = kasUmumTxns.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0)
    const kasKeluar = kasUmumTxns.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
    const kasPrev = kasBalance - kasMasuk + kasKeluar
    const divPrev = sortedDivs.map(div => {
      const txns = divTxns.filter(t => t.divisionId === div.id)
      return div.balance - txns.filter(t => t.type === 'masuk').reduce((s, t) => s + t.amount, 0)
        + txns.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
    })
    const prevJumlah = kasPrev + divPrev.slice(0, divCount - 1).reduce((s, b) => s + b, 0)

    const saldoPrevRow = ws.addRow(['', 'Saldo Kas Wilayah Bulan Lalu', '', kasPrev, ...divPrev, prevJumlah, ''])
    styleNum(saldoPrevRow.getCell(4))
    divPrev.forEach((_, i) => styleNum(saldoPrevRow.getCell(5 + i)))
    styleNum(saldoPrevRow.getCell(5 + divCount))
    ws.addRow([])

    const pen15 = kasUmumTxns.filter(t => t.type === 'masuk' && t.desc.startsWith('Persepuluhan')).reduce((s, t) => s + t.amount, 0)
    const kolekte = kasUmumTxns.filter(t => t.type === 'masuk' && !t.desc.startsWith('Persepuluhan')).reduce((s, t) => s + t.amount, 0)
    ws.addRow(['', '2.  PENERIMAAN', ...Array(divCount + 3).fill('')]).font = { bold: true }
    const rP15 = ws.addRow(['', '      A. PENERIMAAN 15%', '', pen15, ...Array(divCount + 2).fill('')]); styleNum(rP15.getCell(4))
    if (kolekte > 0) { const rK = ws.addRow(['', 'B. KOLEKTE', '', kolekte, ...Array(divCount + 2).fill('')]); styleNum(rK.getCell(4)) }
    const rJP = ws.addRow(['', 'JUMLAH', '', pen15 + kolekte, ...Array(divCount + 2).fill('')]); rJP.font = { bold: true }; styleNum(rJP.getCell(4))
    ws.addRow([])

    ws.addRow(['', '3.  PENGELUARAN KAS', ...Array(divCount + 3).fill('')]).font = { bold: true }
    for (const txn of kasUmumTxns.filter(t => t.type === 'keluar')) {
      const r = ws.addRow(['', `-  ${txn.desc}`, '', txn.amount, ...Array(divCount + 2).fill('')]); styleNum(r.getCell(4))
    }
    const diakoniaIdx = sortedDivs.findIndex(d => d.name.toUpperCase().includes('DIAKONIA'))
    const diakoniaId = diakoniaIdx !== -1 ? sortedDivs[diakoniaIdx].id : null
    for (const txn of divTxns.filter(t => t.type === 'keluar' && t.divisionId === diakoniaId)) {
      const amounts = Array(divCount + 2).fill('')
      amounts[diakoniaIdx + 1] = txn.amount
      const r = ws.addRow(['', `-  ${txn.desc}`, '', ...amounts, '']); styleNum(r.getCell(5 + diakoniaIdx))
    }
    const grouped = new Map<string, Map<number, number>>()
    for (const txn of divTxns.filter(t => t.type === 'keluar' && t.divisionId !== diakoniaId)) {
      const i = sortedDivs.findIndex(d => d.id === txn.divisionId); if (i === -1) continue
      if (!grouped.has(txn.desc)) grouped.set(txn.desc, new Map())
      grouped.get(txn.desc)!.set(i, (grouped.get(txn.desc)!.get(i) ?? 0) + txn.amount)
    }
    for (const [desc, divAmounts] of grouped) {
      const amounts = Array(divCount + 2).fill('')
      for (const [i, amount] of divAmounts) amounts[i + 1] = amount
      const r = ws.addRow(['', `-  ${desc}`, '', ...amounts, ''])
      for (const [i] of divAmounts) styleNum(r.getCell(5 + i))
    }

    const kasKeluarTotal = kasUmumTxns.filter(t => t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
    const divKeluarTotals = sortedDivs.map(div =>
      divTxns.filter(t => t.divisionId === div.id && t.type === 'keluar').reduce((s, t) => s + t.amount, 0)
    )
    const keluarJumlah = kasKeluarTotal + divKeluarTotals.slice(0, divCount - 1).reduce((s, a) => s + a, 0)
    const rJK = ws.addRow(['', 'JUMLAH PENGELUARAN', '', kasKeluarTotal, ...divKeluarTotals, keluarJumlah, ''])
    rJK.font = { bold: true }; styleNum(rJK.getCell(4))
    divKeluarTotals.forEach((_, i) => styleNum(rJK.getCell(5 + i))); styleNum(rJK.getCell(5 + divCount))
    ws.addRow([])

    const divCurr = sortedDivs.map(d => d.balance)
    const currJumlah = kasBalance + divCurr.slice(0, divCount - 1).reduce((s, b) => s + b, 0)
    const rSaldo = ws.addRow(['', 'SALDO KAS WILAYAH BULAN INI', '', kasBalance, ...divCurr, currJumlah, ''])
    rSaldo.font = { bold: true }; styleNum(rSaldo.getCell(4))
    divCurr.forEach((_, i) => styleNum(rSaldo.getCell(5 + i))); styleNum(rSaldo.getCell(5 + divCount))
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 2 — MD
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet('MD')
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
    hr.font = { bold: true }; hr.height = 28; hr.eachCell(c => styleHeader(c))

    const total = meeting.submissions.reduce((s, sub) => s + sub.persepuluhan, 0)
    meeting.submissions.forEach((sub, i) => {
      const title = TITLE_LABEL[sub.pastor.title] ?? ''
      const nameStr = title ? `${sub.pastor.name}, ${title}` : sub.pastor.name
      const row = ws.addRow([i + 1, nameStr, sub.pastor.pelayanan ?? '', sub.persepuluhan, sub.bulan > 1 ? `${sub.bulan} BLN` : ''])
      styleNum(row.getCell(4))
    })

    ws.addRow([])
    const totalRow = ws.addRow(['', 'TOTAL PERSEMBAHAN', '', total, '']); totalRow.font = { bold: true }; styleNum(totalRow.getCell(4))

    const pct15 = Math.round(total * 0.15); const pct85 = Math.round(total * 0.85)
    ws.addRow([])
    const r15 = ws.addRow(['', '15% KAS WILAYAH II MADIUN', '', pct15, '']); styleNum(r15.getCell(4))
    ws.addRow([])
    const r85 = ws.addRow(['', '85% KAS MD', '', pct85, '']); r85.font = { bold: true }; styleNum(r85.getCell(4))
    for (const item of meeting.setorItems) {
      const r = ws.addRow(['', item.desc, '', item.amount, '']); styleNum(r.getCell(4))
    }
    const netSetor = meeting.setorNetAmount ?? (pct85 - meeting.setorItems.reduce((s, i) => s + i.amount, 0))
    const setorRow = ws.addRow(['', 'SETOR KAS MAJELIS DAERAH', '', netSetor, '']); setorRow.font = { bold: true }; styleNum(setorRow.getCell(4))

    ws.addRow([])
    ws.addRow(['', '', '', `Madiun, ${fmtSetorDate(meeting.setorDate)}`, ''])
    ws.addRow(['', '', '', 'BENDAHARA WIL II MADIUN', ''])
    ws.addRow([]); ws.addRow([]); ws.addRow([])
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 3 — DANA KESEJAHTERAAN
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet('Dana Kesejahteraan')
    ws.columns = [
      { key: 'no', width: 6 }, { key: 'nama', width: 38 },
      { key: 'pelayanan', width: 22 }, { key: 'amount', width: 16 }, { key: 'ket', width: 10 },
    ]

    const r1 = ws.addRow(['DANA KESEJAHTERAAN HAMBA-HAMBA TUHAN', '', '', '', ''])
    ws.mergeCells(`A${r1.number}:E${r1.number}`)
    r1.getCell(1).font = { bold: true, size: 12 }; r1.getCell(1).alignment = { horizontal: 'center' }

    const r2 = ws.addRow([`GPdI WILAYAH II MADIUN BULAN ${monthLabel}`, '', '', '', ''])
    ws.mergeCells(`A${r2.number}:E${r2.number}`)
    r2.getCell(1).font = { bold: true, size: 11 }; r2.getCell(1).alignment = { horizontal: 'center' }
    ws.addRow([])

    const hr = ws.addRow(['NO.', 'NAMA HAMBA-HAMBA TUHAN', 'PELAYANAN', 'DANA\nKESEJAHTERAAN', 'Ket'])
    hr.font = { bold: true }; hr.height = 36; hr.eachCell(c => styleHeader(c))

    let total = 0
    meeting.submissions.forEach((sub, i) => {
      const title = TITLE_LABEL[sub.pastor.title] ?? ''
      const nameStr = title ? `${sub.pastor.name}, ${title}` : sub.pastor.name
      const amount = kesehatanDiv ? (sub.wadahEntries.find(w => w.divisionId === kesehatanDiv.id)?.amount ?? 0) : 0
      const row = ws.addRow([i + 1, nameStr, sub.pastor.pelayanan ?? '', amount || '', sub.bulan > 1 ? `${sub.bulan} BLN` : ''])
      if (amount) styleNum(row.getCell(4))
      total += amount
    })

    ws.addRow([])
    const totalRow = ws.addRow(['', 'TOTAL PERSEMBAHAN', '', total, '']); totalRow.font = { bold: true }; styleNum(totalRow.getCell(4))
    ws.addRow([])
    ws.addRow(['', '', '', `Madiun, ${fmtSetorDate(meeting.setorDate)}`, ''])
    ws.addRow(['', '', '', 'BENDAHARA WIL II MADIUN', ''])
    ws.addRow([]); ws.addRow([]); ws.addRow([])
  }

  const buf = await wb.xlsx.writeBuffer()
  const [ym, mm] = meeting.month.split('-')
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="laporan-bulanan-${MONTHS_FULL[mm] ?? mm}-${ym}.xlsx"`,
    },
  })
}
