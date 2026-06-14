'use client'

import { useState } from 'react'
import { FormShell } from '@/components/forms/FormShell'
import { AlertModal } from '@/components/ui/AlertModal'

export default function FormWorshipClient({
  token,
  alreadySubmitted,
}: {
  token: string
  alreadySubmitted: boolean
}) {
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(alreadySubmitted)
  const [alert, setAlert] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (submitted) return
    const trimmed = answer.trim()
    if (!trimmed) {
      setAlert('Tulis jawabanmu dulu')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/yc/api/p/${token}/form/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) setSubmitted(true)
        setAlert(data.error || 'Gagal mengirim')
        return
      }
      setSubmitted(true)
      setAlert('Terima kasih! Jawabanmu sudah terkirim secara anonim.')
    } catch {
      setAlert('Gagal mengirim')
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormShell title="Form Worship Night" back={`/yc/p/${token}`}>
      <div className="card yc-worship-form">
        <div className="yc-worship-form-inner">
          <h2 className="yc-worship-question">
            What Do You Think About When Nobody Is Around?
          </h2>
          <div className="yc-worship-prompt">
            <p>Saat semua notifikasi berhenti...</p>
            <p>Saat semua orang tidur...</p>
            <p>Saat kamu sendirian...</p>
            <p>Apa yang paling sering memenuhi pikiranmu?</p>
          </div>
          {submitted && (
            <p className="yc-worship-submitted-note">
              Kamu sudah mengirim jawaban. Terima kasih!
            </p>
          )}
          <form onSubmit={submit} className="yc-worship-form-fields">
            <textarea
              className="form-input yc-worship-textarea"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={8}
              placeholder="Tulis di sini..."
              disabled={submitted}
            />
            <button type="submit" className="submit-btn" disabled={loading || submitted}>
              {loading ? 'Mengirim...' : submitted ? 'Sudah Terkirim' : 'Submit Anonim'}
            </button>
          </form>
        </div>
      </div>
      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </FormShell>
  )
}
