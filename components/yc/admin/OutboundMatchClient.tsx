'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormShell } from '@/components/forms/FormShell'
import { GroupIcon } from '@/components/yc/GroupIcon'
import { AlertModal } from '@/components/ui/AlertModal'
import { YC_GROUP_COUNT, YC_OUTBOUND_GUESS_POINTS, YC_OUTBOUND_WIN_POINTS, YC_OUTBOUND_YEL_YEL_MAX, YC_OUTBOUND_YEL_YEL_MIN } from '@/lib/yc/constants'
import type { OutboundMatchDetail } from '@/lib/yc/actions/outbound'
import { saveOutboundGuesses, saveOutboundYelYel, setOutboundWinner } from '@/lib/yc/actions/outbound'

function GuessSelect({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <select
        id={id}
        className="form-select"
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— Pilih kelompok —</option>
        {Array.from({ length: YC_GROUP_COUNT }, (_, i) => i + 1).map(num => (
          <option key={num} value={String(num)}>
            Kelompok {num}
          </option>
        ))}
      </select>
    </div>
  )
}

function ResultBadge({
  correct,
  pointsAwarded,
}: {
  correct: boolean | null
  pointsAwarded: boolean
}) {
  if (correct == null) return null
  if (correct) {
    return (
      <div className="yc-outbound-result yc-outbound-result--ok">
        Benar {pointsAwarded ? `(+${YC_OUTBOUND_GUESS_POINTS} poin)` : '(poin sudah diberikan)'}
      </div>
    )
  }
  return <div className="yc-outbound-result yc-outbound-result--fail">Salah (0 poin)</div>
}

export default function OutboundMatchClient({ match }: { match: OutboundMatchDetail }) {
  const router = useRouter()
  const [teamAGuess, setTeamAGuess] = useState(match.teamAGuessNum != null ? String(match.teamAGuessNum) : '')
  const [teamBGuess, setTeamBGuess] = useState(match.teamBGuessNum != null ? String(match.teamBGuessNum) : '')
  const [teamACorrect, setTeamACorrect] = useState<boolean | null>(match.teamACorrect)
  const [teamBCorrect, setTeamBCorrect] = useState<boolean | null>(match.teamBCorrect)
  const [teamAPointsAwarded, setTeamAPointsAwarded] = useState(match.teamAGuessPointsAwarded)
  const [teamBPointsAwarded, setTeamBPointsAwarded] = useState(match.teamBGuessPointsAwarded)
  const [winnerGroupId, setWinnerGroupId] = useState(match.winnerGroupId)
  const [winnerName, setWinnerName] = useState(match.winnerName)
  const [winnerPointsAwarded, setWinnerPointsAwarded] = useState(match.winnerPointsAwarded)
  const [teamAYelYel, setTeamAYelYel] = useState(String(match.teamAYelYelPoints))
  const [teamBYelYel, setTeamBYelYel] = useState(String(match.teamBYelYelPoints))
  const [loading, setLoading] = useState<'save' | 'yel-yel' | 'winner-a' | 'winner-b' | null>(null)
  const [alert, setAlert] = useState<string | null>(null)

  async function handleSave() {
    setLoading('save')
    try {
      const res = await saveOutboundGuesses(
        match.id,
        teamAGuess ? Number(teamAGuess) : null,
        teamBGuess ? Number(teamBGuess) : null,
      )
      if (res && 'error' in res) {
        setAlert(res.error!)
        return
      }
      if (res && 'ok' in res) {
        setTeamACorrect(res.teamACorrect ?? null)
        setTeamBCorrect(res.teamBCorrect ?? null)
        if (res.teamAPointsAwarded) setTeamAPointsAwarded(true)
        if (res.teamBPointsAwarded) setTeamBPointsAwarded(true)
        router.refresh()
      }
    } catch {
      setAlert('Gagal menyimpan tebakan')
    } finally {
      setLoading(null)
    }
  }

  async function handleSaveYelYel() {
    setLoading('yel-yel')
    try {
      const res = await saveOutboundYelYel(
        match.id,
        Number(teamAYelYel) || 0,
        Number(teamBYelYel) || 0,
      )
      if (res && 'error' in res) {
        setAlert(res.error!)
        return
      }
      if (res && 'ok' in res) {
        setTeamAYelYel(String(res.teamAYelYelPoints))
        setTeamBYelYel(String(res.teamBYelYelPoints))
        router.refresh()
      }
    } catch {
      setAlert('Gagal menyimpan poin yel-yel')
    } finally {
      setLoading(null)
    }
  }

  async function handleWinner(groupId: string, name: string, key: 'winner-a' | 'winner-b') {
    setLoading(key)
    try {
      const res = await setOutboundWinner(match.id, groupId)
      if (res && 'error' in res) {
        setAlert(res.error!)
        return
      }
      setWinnerGroupId(groupId)
      setWinnerName(name)
      setWinnerPointsAwarded(true)
      router.refresh()
    } catch {
      setAlert('Gagal menetapkan pemenang')
    } finally {
      setLoading(null)
    }
  }

  function winnerBtnClass(groupId: string) {
    if (!winnerGroupId) return 'submit-btn yc-outbound-btn-muted'
    return winnerGroupId === groupId ? 'submit-btn' : 'submit-btn yc-outbound-btn-muted'
  }

  return (
    <FormShell title={match.label} back="/yc/admin/outbound">
      <div className="card yc-outbound-matchup-card">
        <div className="txn-row" style={{ borderBottom: 'none' }}>
          <GroupIcon name={match.teamAName} slug={match.teamASlug} size={44} />
          <div className="txn-info">
            <div className="txn-desc">{match.teamAName}</div>
            <div className="txn-meta">Tim A · Pos {match.position}</div>
          </div>
        </div>
        <div className="yc-outbound-vs">vs</div>
        <div className="txn-row" style={{ borderBottom: 'none' }}>
          <GroupIcon name={match.teamBName} slug={match.teamBSlug} size={44} />
          <div className="txn-info">
            <div className="txn-desc">{match.teamBName}</div>
            <div className="txn-meta">Tim B · Pos {match.position}</div>
          </div>
        </div>
      </div>

      <div className="section-header yc-outbound-section" style={{ marginTop: 0 }}>
        <div className="section-title">Poin Yel-yel</div>
      </div>
      <p className="yc-outbound-helper">
        Penilaian yel-yel per tim di pos ini ({YC_OUTBOUND_YEL_YEL_MIN}–{YC_OUTBOUND_YEL_YEL_MAX}{' '}
        poin, masuk ke total kelompok).
      </p>
      <div className="card yc-outbound-form-card">
        <div className="form-group">
          <label htmlFor="team-a-yel-yel" className="form-label">
            {match.teamAName}
          </label>
          <input
            id="team-a-yel-yel"
            type="number"
            className="form-input"
            min={YC_OUTBOUND_YEL_YEL_MIN}
            max={YC_OUTBOUND_YEL_YEL_MAX}
            value={teamAYelYel}
            disabled={loading != null}
            onChange={e => setTeamAYelYel(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="team-b-yel-yel" className="form-label">
            {match.teamBName}
          </label>
          <input
            id="team-b-yel-yel"
            type="number"
            className="form-input"
            min={YC_OUTBOUND_YEL_YEL_MIN}
            max={YC_OUTBOUND_YEL_YEL_MAX}
            value={teamBYelYel}
            disabled={loading != null}
            onChange={e => setTeamBYelYel(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="submit-btn yc-outbound-form-actions"
          disabled={loading != null}
          onClick={handleSaveYelYel}
        >
          {loading === 'yel-yel' ? 'Menyimpan…' : 'Simpan Poin Yel-yel'}
        </button>
      </div>

      <div className="section-header yc-outbound-section">
        <div className="section-title">Tebakan Lawan Berikutnya</div>
      </div>
      <p className="yc-outbound-helper">
        Catat tebakan setelah ronde ini selesai. Benar = lawan di ronde berikutnya (+{YC_OUTBOUND_GUESS_POINTS}{' '}
        poin).
      </p>
      <div className="card yc-outbound-form-card">
        <div className="yc-outbound-guess-block">
          {match.teamAClue && match.teamANextOpponent != null && (
            <div className="yc-outbound-clue">
              <div className="yc-outbound-clue-label">{match.teamAName} — petunjuk</div>
              <div className="yc-outbound-clue-text">{match.teamAClue.clue}</div>
              <div className="yc-outbound-clue-meta">
                Jawaban petunjuk: {match.teamAClue.answer} · Lawan berikutnya: Kelompok{' '}
                {match.teamANextOpponent}
              </div>
            </div>
          )}
          <GuessSelect
            id="team-a-guess"
            label={`${match.teamAName} — tebak lawan berikutnya`}
            value={teamAGuess}
            onChange={setTeamAGuess}
            disabled={loading != null}
          />
          <ResultBadge correct={teamACorrect} pointsAwarded={teamAPointsAwarded} />
        </div>

        <div className="yc-outbound-guess-block">
          {match.teamBClue && match.teamBNextOpponent != null && (
            <div className="yc-outbound-clue">
              <div className="yc-outbound-clue-label">{match.teamBName} — petunjuk</div>
              <div className="yc-outbound-clue-text">{match.teamBClue.clue}</div>
              <div className="yc-outbound-clue-meta">
                Jawaban petunjuk: {match.teamBClue.answer} · Lawan berikutnya: Kelompok{' '}
                {match.teamBNextOpponent}
              </div>
            </div>
          )}
          <GuessSelect
            id="team-b-guess"
            label={`${match.teamBName} — tebak lawan berikutnya`}
            value={teamBGuess}
            onChange={setTeamBGuess}
            disabled={loading != null}
          />
          <ResultBadge correct={teamBCorrect} pointsAwarded={teamBPointsAwarded} />
        </div>

        <button
          type="button"
          className="submit-btn yc-outbound-form-actions"
          disabled={loading != null}
          onClick={handleSave}
        >
          {loading === 'save' ? 'Menyimpan…' : 'Simpan Tebakan'}
        </button>
      </div>

      <div className="section-header yc-outbound-section">
        <div className="section-title">Pemenang Outbound</div>
      </div>
      <p className="yc-outbound-helper">
        Pilih tim pemenang game di pos ini (+{YC_OUTBOUND_WIN_POINTS} poin).
      </p>
      <div className="card yc-outbound-form-card">
        {winnerGroupId && winnerName ? (
          <div className="yc-outbound-result yc-outbound-result--ok">
            Pemenang: {winnerName}{' '}
            {winnerPointsAwarded
              ? `(+${YC_OUTBOUND_WIN_POINTS} poin)`
              : '(poin akan diberikan saat dikonfirmasi)'}
          </div>
        ) : null}
        <div className="yc-outbound-winner-btns">
          <button
            type="button"
            className={winnerBtnClass(match.teamAId)}
            disabled={loading != null || !match.teamAId}
            onClick={() => handleWinner(match.teamAId, match.teamAName, 'winner-a')}
          >
            {loading === 'winner-a' ? '…' : `${match.teamAName} Menang`}
          </button>
          <button
            type="button"
            className={winnerBtnClass(match.teamBId)}
            disabled={loading != null || !match.teamBId}
            onClick={() => handleWinner(match.teamBId, match.teamBName, 'winner-b')}
          >
            {loading === 'winner-b' ? '…' : `${match.teamBName} Menang`}
          </button>
        </div>
      </div>

      {alert && <AlertModal message={alert} onClose={() => setAlert(null)} />}
    </FormShell>
  )
}
