'use client'

import { useState } from 'react'
import Link from 'next/link'

const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const TITLE_LABEL: Record<string, string> = { pdp: 'PDP', pdm: 'PDM', pdt: 'PDT' }

function fmtMonth(ym: string): string {
  const [y, m] = ym.split('-')
  return `${MONTHS_ID[parseInt(m) - 1]} ${y}`
}

function fmtDatetime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface SubmissionLog {
  id: string
  pastorName: string
  pastorTitle: string
  meetingId: string
  meetingMonth: string
  persepuluhan: number
  bulan: number
  status: string
  ipAddress: string
  submittedAt: string
}

interface Props {
  submissions: SubmissionLog[]
  meetings: { id: string; month: string }[]
}

export default function SubmissionLogClient({ submissions, meetings }: Props) {
  const [filterMeeting, setFilterMeeting] = useState('')
  const [filterIp, setFilterIp] = useState('')

  const filtered = submissions.filter(s => {
    if (filterMeeting && s.meetingId !== filterMeeting) return false
    if (filterIp && !s.ipAddress.includes(filterIp)) return false
    return true
  })

  const ipCounts = new Map<string, number>()
  for (const s of submissions) {
    if (filterMeeting && s.meetingId !== filterMeeting) continue
    ipCounts.set(s.ipAddress, (ipCounts.get(s.ipAddress) ?? 0) + 1)
  }

  return (
    <div className="screen">
      <div className="topnav">
        <Link href="/" className="back-btn">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <div className="topnav-title">IP Submission Log</div>
          <div className="topnav-sub">{filtered.length} entri</div>
        </div>
      </div>

      <div className="content">
        <div className="card" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div className="form-label" style={{ marginBottom: 6 }}>Filter Pertemuan</div>
            <select
              className="form-input"
              value={filterMeeting}
              onChange={e => setFilterMeeting(e.target.value)}
            >
              <option value="">Semua pertemuan</option>
              {meetings.map(m => (
                <option key={m.id} value={m.id}>{fmtMonth(m.month)}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="form-label" style={{ marginBottom: 6 }}>Filter IP</div>
            <input
              className="form-input"
              type="text"
              placeholder="Cari IP address..."
              value={filterIp}
              onChange={e => setFilterIp(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ overflow: 'auto', marginTop: 12 }}>
          {filtered.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>
              <div className="empty-text">Tidak ada data</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>PENDETA</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>PERTEMUAN</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>IP ADDRESS</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>WAKTU</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const dupIp = (ipCounts.get(s.ipAddress) ?? 0) > 1
                  return (
                    <tr key={s.id} style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 500 }}>{s.pastorName}</span>
                        {' '}
                        <span className={`badge pastor-title-${s.pastorTitle}`} style={{ fontSize: 10 }}>
                          {TITLE_LABEL[s.pastorTitle] ?? s.pastorTitle.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-sub)' }}>
                        {fmtMonth(s.meetingMonth)}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: dupIp ? 'var(--red)' : 'inherit' }}>
                          {s.ipAddress}
                        </span>
                        {dupIp && (
                          <span className="badge" style={{ marginLeft: 6, fontSize: 10, background: 'oklch(0.95 0.06 20)', color: 'var(--red)' }}>
                            duplikat
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--text-sub)', fontSize: 12 }}>
                        {fmtDatetime(s.submittedAt)}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className={`badge ${s.status === 'approved' ? 'masuk' : ''}`} style={{ fontSize: 11 }}>
                          {s.status === 'approved' ? 'Disetujui' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  )
}
