'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormShell } from '@/components/forms/FormShell'
import { AlertModal } from '@/components/ui/AlertModal'
import type { YcEmergencyStatus } from '@/lib/yc/types'

export default function EmergencyClient({
  token,
  slug,
  challengeTitle,
  initial,
}: {
  token: string
  slug: string
  challengeTitle: string
  initial: YcEmergencyStatus
}) {
  const router = useRouter()
  const [status, setStatus] = useState(initial)
  const [selected, setSelected] = useState(initial.myVote ?? '')
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<string | null>(null)
  const [successRedirect, setSuccessRedirect] = useState<string | null>(null)
  const [retrySeconds, setRetrySeconds] = useState(0)
  const [quizSeconds, setQuizSeconds] = useState(() => {
    if (!initial.quizExpiresAt || initial.status !== 'QUIZ_OPEN') return 0
    return Math.max(0, Math.ceil((new Date(initial.quizExpiresAt).getTime() - Date.now()) / 1000))
  })

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/yc/api/p/${token}/challenges/${slug}/emergency/status`)
      if (!res.ok) return
      const data: YcEmergencyStatus = await res.json()
      setStatus(data)
      if (data.myVote) setSelected(data.myVote)
    } catch { /* ignore */ }
  }, [token, slug])

  useEffect(() => {
    const id = setInterval(fetchStatus, 2000)
    return () => clearInterval(id)
  }, [fetchStatus])

  useEffect(() => {
    if (!status.retryAvailableAt) {
      setRetrySeconds(0)
      return
    }
    const tick = () => {
      const diff = new Date(status.retryAvailableAt!).getTime() - Date.now()
      setRetrySeconds(Math.max(0, Math.ceil(diff / 1000)))
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [status.retryAvailableAt])

  useEffect(() => {
    if (!status.quizExpiresAt || status.status !== 'QUIZ_OPEN') {
      setQuizSeconds(0)
      return
    }
    const tick = () => {
      const diff = new Date(status.quizExpiresAt!).getTime() - Date.now()
      setQuizSeconds(Math.max(0, Math.ceil(diff / 1000)))
    }
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [status.quizExpiresAt, status.status])

  async function markReady() {
    setLoading(true)
    try {
      const res = await fetch(`/yc/api/p/${token}/challenges/${slug}/emergency/ready`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setAlert(data.error || 'Gagal')
        return
      }
      setStatus(data)
    } catch {
      setAlert('Gagal')
    } finally {
      setLoading(false)
    }
  }

  async function handleOpenQuiz() {
    setLoading(true)
    try {
      const res = await fetch(`/yc/api/p/${token}/challenges/${slug}/emergency/open-quiz`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setAlert(data.error || 'Gagal membuka quiz')
        return
      }
      setStatus(data)
      setSelected('')
    } catch {
      setAlert('Gagal membuka quiz')
    } finally {
      setLoading(false)
    }
  }

  function showQuizSuccess(data: {
    points?: number
    fragmentOrder?: number
    totalFragments?: number
    allDone?: boolean
  }) {
    const extra = data.allDone
      ? '\nSemua fragment recovered — challenge selesai!'
      : `\nFragment ${data.fragmentOrder}/${data.totalFragments} · Lanjut cari fragment berikutnya.`
    setSuccessRedirect(`🧩 Memory Fragment Recovered!\n+${data.points} Team Points${extra}`)
  }

  async function submitQuiz() {
    if (!status.quizQuestion || !selected) return

    setLoading(true)
    try {
      const res = await fetch(`/yc/api/p/${token}/challenges/${slug}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: status.quizQuestion.id,
          selectedAnswer: selected,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAlert(data.error || 'Gagal submit')
        await fetchStatus()
        return
      }
      if (data.correct) {
        showQuizSuccess(data)
      } else {
        setAlert('❌ Jawaban Salah\n"Ayo pikirkan secara logika jawabannya..."\nCoba lagi dalam 30 detik.')
        await fetchStatus()
      }
    } catch {
      setAlert('Gagal submit')
    } finally {
      setLoading(false)
    }
  }

  const showQuiz = status.status === 'QUIZ_OPEN' && status.quizQuestion
  const canAnswer = status.isQrTrigger || status.isCaptain
  const quizTimedOut =
    showQuiz &&
    status.quizExpiresAt !== null &&
    new Date(status.quizExpiresAt).getTime() <= Date.now()
  const canSelect = Boolean(showQuiz && canAnswer && !quizTimedOut)
  const inGatherPhase = ['EMERGENCY', 'WAITING'].includes(status.status)

  return (
    <FormShell title="Emergency Meeting" sub={challengeTitle} back={`/yc/p/${token}/challenge/${slug}`}>
      <div className="balance-card" style={{ background: 'var(--red)' }}>
        <div className="balance-label">Status</div>
        <div className="balance-amount" style={{ fontSize: 22 }}>{status.status}</div>
        {inGatherPhase && (
          <div className="balance-date">
            Seseorang menemukan QR Fragment — kumpul di <strong>Aula</strong> sekarang.
          </div>
        )}
      </div>

      {inGatherPhase && (
        <div className="card" style={{ padding: 16 }}>
          <div className="yc-progress-stat">
            {status.readyCount}/{status.totalCount} anggota sudah kumpul
          </div>
          {status.missingCount > 0 ? (
            <div className="yc-progress-hint">
              Kurang {status.missingCount} orang{status.waitingFor.length > 0 ? `: ${status.waitingFor.join(', ')}` : ''}
            </div>
          ) : (
            <div className="yc-progress-hint yc-progress-hint--ok">Semua anggota sudah kumpul!</div>
          )}

          {status.isQrTrigger && (
            <div className="yc-qr-trigger-panel">
              {status.allReady ? (
                <button className="submit-btn" disabled={loading} onClick={handleOpenQuiz}>
                  Open Quiz
                </button>
              ) : (
                <div className="yc-progress-hint">
                  Menunggu {status.missingCount} anggota lagi sebelum quiz bisa dibuka…
                </div>
              )}
            </div>
          )}

          {!status.isQrTrigger && status.allReady && (
            <div className="yc-progress-hint">
              Semua sudah kumpul — menunggu pemindai QR membuka quiz.
            </div>
          )}

          {status.hasMarkedReady ? (
            <button className="submit-btn yc-btn-done" disabled>
              Sudah Kumpul
            </button>
          ) : (
            <button className="submit-btn" disabled={loading} onClick={markReady}>
              Kumpul di Aula
            </button>
          )}
        </div>
      )}

      {status.status === 'FAILED' && retrySeconds > 0 && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            {status.quizFailureReason === 'timeout' ? '⏱ Waktu Habis' : '❌ Jawaban Salah'}
          </div>
          <div className="yc-progress-hint">
            {status.quizFailureReason === 'timeout'
              ? 'Kelompok belum submit tepat waktu. Buka quiz ulang setelah countdown.'
              : '"Ayo pikirkan secara logika jawabannya..."'}
          </div>
          <div className="yc-progress-hint" style={{ marginTop: 8 }}>
            Coba lagi dalam {retrySeconds} detik…
          </div>
          {status.isQrTrigger && retrySeconds === 0 && (
            <button className="submit-btn" style={{ marginTop: 12 }} disabled={loading} onClick={handleOpenQuiz}>
              Open Quiz
            </button>
          )}
        </div>
      )}

      {showQuiz && status.quizQuestion && (
        <div className="card" style={{ padding: 16 }}>
          <div className={`yc-quiz-timer ${quizSeconds <= 3 ? 'yc-quiz-timer--urgent' : ''}`}>
            {quizTimedOut ? 'Waktu habis!' : `${quizSeconds}s`}
          </div>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>{status.quizQuestion.question}</div>

          {canAnswer ? (
            <>
              {(['A', 'B', 'C', 'D'] as const).map(key => {
                const optKey = `option${key}` as keyof typeof status.quizQuestion
                const label = status.quizQuestion![optKey] as string
                return (
                  <label
                    key={key}
                    className={canSelect ? 'yc-quiz-option' : 'yc-quiz-option yc-quiz-option--disabled'}
                  >
                    <input
                      type="radio"
                      name="quiz"
                      value={key}
                      checked={selected === key}
                      disabled={!canSelect}
                      onChange={() => setSelected(key)}
                    />
                    <span>{key}. {label}</span>
                  </label>
                )
              })}

              {canSelect && (
                <button
                  className="submit-btn"
                  style={{ marginTop: 12 }}
                  disabled={loading || !selected}
                  onClick={submitQuiz}
                >
                  Submit Jawaban
                </button>
              )}
            </>
          ) : (
            <div className="yc-progress-hint" style={{ marginTop: 8 }}>
              Menunggu pemindai QR atau captain menjawab quiz…
            </div>
          )}
        </div>
      )}

      {status.status === 'COMPLETED' && (
        <div className="empty">
          <div className="empty-icon">🧩</div>
          <div className="empty-text">Memory Fragment Recovered!</div>
          <div className="empty-sub">Challenge selesai — +poin untuk kelompok.</div>
        </div>
      )}

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
      {successRedirect && (
        <AlertModal
          message={successRedirect}
          onClose={() => router.push(`/yc/p/${token}/challenge/${slug}`)}
        />
      )}
    </FormShell>
  )
}
