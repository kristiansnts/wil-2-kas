import { prisma } from '@/lib/prisma'
import { YC_QUIZ_ANSWER_SECONDS, YC_QUIZ_RETRY_SECONDS } from './constants'
import { addGroupPoints } from './points'
import type { YcEmergencyActive, YcEmergencyStatus } from './types'

const QUIZ_MS = YC_QUIZ_ANSWER_SECONDS * 1000
const RETRY_MS = YC_QUIZ_RETRY_SECONDS * 1000

function normalizeQuizAnswer(value: string): string {
  const trimmed = value.trim().toUpperCase()
  const letter = trimmed.match(/^([ABCD])/)?.[1]
  return letter ?? trimmed
}

function isQuizExpired(quizOpenedAt: Date | null): boolean {
  if (!quizOpenedAt) return false
  return Date.now() >= quizOpenedAt.getTime() + QUIZ_MS
}

async function clearQuizVotes(sessionId: string) {
  await prisma.ycQuizVote.deleteMany({ where: { sessionId } })
}

async function pickRandomQuestion(challengeId: string, excludeQuestionId?: string | null) {
  const questions = await prisma.ycQuizQuestion.findMany({ where: { challengeId } })
  if (questions.length === 0) return null
  const pool = excludeQuestionId
    ? questions.filter(q => q.id !== excludeQuestionId)
    : questions
  const candidates = pool.length > 0 ? pool : questions
  return candidates[Math.floor(Math.random() * candidates.length)]
}

async function applyQuizTimeout(sessionId: string) {
  const retryAt = new Date(Date.now() + RETRY_MS)
  await clearQuizVotes(sessionId)
  await prisma.ycTeamChallengeSession.update({
    where: { id: sessionId },
    data: {
      status: 'FAILED',
      retryAvailableAt: retryAt,
      quizOpenedAt: null,
    },
  })
  return retryAt
}

async function countRecoveredFragments(sessionId: string, challengeId: string) {
  const [total, recovered] = await Promise.all([
    prisma.ycQuizQuestion.count({ where: { challengeId } }),
    prisma.ycQuizAttempt.count({
      where: { sessionId, isCorrect: true },
    }),
  ])
  return { total, recovered }
}

export async function getFragmentProgress(groupId: string, challengeId: string) {
  const session = await prisma.ycTeamChallengeSession.findUnique({
    where: { groupId_challengeId: { groupId, challengeId } },
  })
  const total = await prisma.ycQuizQuestion.count({ where: { challengeId } })
  if (!session) return { recovered: 0, total }
  const recovered = await prisma.ycQuizAttempt.count({
    where: { sessionId: session.id, isCorrect: true },
  })
  return { recovered, total }
}

export async function isFragmentRecovered(sessionId: string, questionId: string) {
  const attempt = await prisma.ycQuizAttempt.findFirst({
    where: { sessionId, questionId, isCorrect: true },
  })
  return Boolean(attempt)
}

export async function getOrCreateTeamSession(groupId: string, challengeId: string) {
  return prisma.ycTeamChallengeSession.upsert({
    where: { groupId_challengeId: { groupId, challengeId } },
    create: { groupId, challengeId },
    update: {},
    include: {
      readyChecks: { include: { participant: { select: { name: true } } } },
      group: { include: { participants: { select: { id: true, name: true } } } },
    },
  })
}

export async function triggerEmergency(
  groupId: string,
  challengeId: string,
  triggeredByParticipantId: string,
  questionId: string,
) {
  const existing = await prisma.ycTeamChallengeSession.findUnique({
    where: { groupId_challengeId: { groupId, challengeId } },
  })
  if (existing?.status === 'COMPLETED') {
    throw new Error('Semua Memory Fragment sudah recovered')
  }
  if (existing && ['EMERGENCY', 'WAITING', 'QUIZ_OPEN', 'FAILED'].includes(existing.status)) {
    throw new Error('Emergency meeting masih berlangsung')
  }

  const alreadyRecovered = existing
    ? await isFragmentRecovered(existing.id, questionId)
    : false
  if (alreadyRecovered) {
    throw new Error('Memory Fragment ini sudah recovered')
  }

  const session = await prisma.ycTeamChallengeSession.upsert({
    where: { groupId_challengeId: { groupId, challengeId } },
    create: {
      groupId,
      challengeId,
      status: 'EMERGENCY',
      emergencyCalledAt: new Date(),
      triggeredByParticipantId,
      currentQuestionId: questionId,
    },
    update: {
      status: 'EMERGENCY',
      emergencyCalledAt: new Date(),
      triggeredByParticipantId,
      currentQuestionId: questionId,
      retryAvailableAt: null,
      completedAt: null,
      quizOpenedAt: null,
    },
  })

  await prisma.ycTeamReadyCheck.deleteMany({ where: { sessionId: session.id } })
  await clearQuizVotes(session.id)
  return session
}

export async function markReady(sessionId: string, participantId: string) {
  const session = await prisma.ycTeamChallengeSession.findUnique({
    where: { id: sessionId },
    include: { group: { include: { participants: true } } },
  })
  if (!session) throw new Error('Session tidak ditemukan')
  if (!['EMERGENCY', 'WAITING'].includes(session.status)) {
    throw new Error('Session tidak menerima ready check')
  }

  await prisma.ycTeamReadyCheck.upsert({
    where: { sessionId_participantId: { sessionId, participantId } },
    create: { sessionId, participantId, isReady: true, readyAt: new Date() },
    update: { isReady: true, readyAt: new Date() },
  })

  if (session.status === 'EMERGENCY') {
    await prisma.ycTeamChallengeSession.update({
      where: { id: sessionId },
      data: { status: 'WAITING' },
    })
  }

  return 'WAITING' as const
}

export async function openQuiz(sessionId: string, participantId: string) {
  const session = await prisma.ycTeamChallengeSession.findUnique({
    where: { id: sessionId },
    include: {
      group: { include: { participants: true } },
      quizAttempts: { orderBy: { attemptedAt: 'desc' }, take: 1 },
    },
  })
  if (!session) throw new Error('Session tidak ditemukan')
  if (session.triggeredByParticipantId !== participantId) {
    throw new Error('Hanya pemindai QR yang bisa membuka quiz')
  }
  if (!['EMERGENCY', 'WAITING'].includes(session.status)) {
    throw new Error('Quiz belum bisa dibuka')
  }

  const readyCount = await prisma.ycTeamReadyCheck.count({
    where: { sessionId, isReady: true },
  })
  const totalCount = session.group.participants.length
  if (readyCount < totalCount || totalCount === 0) {
    throw new Error('Belum semua anggota kumpul')
  }

  if (!session.currentQuestionId) {
    throw new Error('Belum ada soal untuk fragment ini')
  }

  const question = await prisma.ycQuizQuestion.findUnique({
    where: { id: session.currentQuestionId },
  })
  if (!question) throw new Error('Soal fragment tidak ditemukan')

  await clearQuizVotes(sessionId)
  await prisma.ycTeamChallengeSession.update({
    where: { id: sessionId },
    data: {
      status: 'QUIZ_OPEN',
      quizOpenedAt: new Date(),
      retryAvailableAt: null,
    },
  })

  return 'QUIZ_OPEN' as const
}

export async function recordQuizVote(
  sessionId: string,
  participantId: string,
  questionId: string,
  selectedAnswer: string,
) {
  const session = await prisma.ycTeamChallengeSession.findUnique({
    where: { id: sessionId },
    include: { group: { include: { participants: true } } },
  })
  if (!session) throw new Error('Session tidak ditemukan')
  if (session.status !== 'QUIZ_OPEN') throw new Error('Quiz belum terbuka')
  if (isQuizExpired(session.quizOpenedAt)) {
    await applyQuizTimeout(sessionId)
    throw new Error(`Waktu habis. Coba lagi dalam ${YC_QUIZ_RETRY_SECONDS} detik`)
  }
  if (session.currentQuestionId !== questionId) throw new Error('Pertanyaan tidak aktif')

  const answer = normalizeQuizAnswer(selectedAnswer)
  if (!/^[ABCD]$/.test(answer)) throw new Error('Jawaban tidak valid')

  await prisma.ycQuizVote.upsert({
    where: { sessionId_participantId: { sessionId, participantId } },
    create: { sessionId, participantId, questionId, selectedAnswer: answer },
    update: { questionId, selectedAnswer: answer, votedAt: new Date() },
  })

  const voteSummary = await getQuizVoteSummary(
    sessionId,
    questionId,
    session.group.participants,
  )

  if (voteSummary.allVoted && voteSummary.allAgree && voteSummary.agreedAnswer) {
    const submitterId =
      session.group.captainParticipantId ??
      session.triggeredByParticipantId ??
      participantId
    return finalizeQuizFromVotes(sessionId, questionId, submitterId)
  }

  return null
}

export type QuizSubmitResult =
  | {
      correct: true
      points: number
      fragmentOrder: number
      recoveredCount: number
      totalFragments: number
      allDone: boolean
    }
  | { correct: false; retryAvailableAt: string }

async function finalizeQuizFromVotes(
  sessionId: string,
  questionId: string,
  submitterParticipantId: string,
) {
  const session = await prisma.ycTeamChallengeSession.findUnique({
    where: { id: sessionId },
    include: { challenge: true, group: { include: { participants: true } } },
  })
  if (!session) throw new Error('Session tidak ditemukan')
  if (session.status !== 'QUIZ_OPEN') throw new Error('Quiz belum terbuka')
  if (isQuizExpired(session.quizOpenedAt)) {
    await applyQuizTimeout(sessionId)
    throw new Error(`Waktu habis. Coba lagi dalam ${YC_QUIZ_RETRY_SECONDS} detik`)
  }
  if (session.currentQuestionId !== questionId) throw new Error('Pertanyaan tidak aktif')

  const question = await prisma.ycQuizQuestion.findUnique({ where: { id: questionId } })
  if (!question) throw new Error('Pertanyaan tidak ditemukan')

  const voteSummary = await getQuizVoteSummary(
    sessionId,
    questionId,
    session.group.participants,
  )
  if (!voteSummary.allVoted) throw new Error('Belum semua anggota konfirmasi pilihan')
  if (!voteSummary.allAgree || !voteSummary.agreedAnswer) {
    throw new Error('Jawaban anggota belum sama — diskusikan ulang')
  }

  const agreedAnswer = voteSummary.agreedAnswer
  const isCorrect =
    normalizeQuizAnswer(question.correctAnswer) === normalizeQuizAnswer(agreedAnswer)

  await prisma.ycQuizAttempt.create({
    data: {
      sessionId,
      questionId,
      attemptedByParticipantId: submitterParticipantId,
      selectedAnswer: agreedAnswer.toUpperCase(),
      isCorrect,
    },
  })

  if (isCorrect) {
    const { total, recovered } = await countRecoveredFragments(sessionId, session.challengeId)
    const allDone = recovered >= total && total > 0
    const pointsPerFragment = Math.max(1, Math.round(session.challenge.points / Math.max(total, 1)))

    await clearQuizVotes(sessionId)
    await prisma.ycTeamChallengeSession.update({
      where: { id: sessionId },
      data: {
        status: allDone ? 'COMPLETED' : 'EXPLORING',
        completedAt: allDone ? new Date() : null,
        retryAvailableAt: null,
        quizOpenedAt: null,
        currentQuestionId: null,
        triggeredByParticipantId: null,
      },
    })
    await addGroupPoints(session.groupId, pointsPerFragment)
    return {
      correct: true as const,
      points: pointsPerFragment,
      fragmentOrder: question.fragmentOrder,
      recoveredCount: recovered,
      totalFragments: total,
      allDone,
    }
  }

  const retryAt = await applyQuizTimeout(sessionId)
  return { correct: false as const, retryAvailableAt: retryAt.toISOString() }
}

async function getQuizVoteSummary(
  sessionId: string,
  questionId: string | null,
  participants: { id: string; name: string | null }[],
) {
  if (!questionId) {
    return {
      quizVotes: participants.map(p => ({
        participantId: p.id,
        name: p.name || 'Peserta',
        selectedAnswer: null as string | null,
      })),
      voteCount: 0,
      allVoted: false,
      allAgree: false,
      uniqueAnswers: [] as string[],
      agreedAnswer: null as string | null,
    }
  }

  const votes = await prisma.ycQuizVote.findMany({
    where: { sessionId, questionId },
    include: { participant: { select: { id: true, name: true } } },
  })
  const voteByParticipant = new Map(votes.map(v => [v.participantId, v.selectedAnswer]))

  const quizVotes = participants.map(p => ({
    participantId: p.id,
    name: p.name || 'Peserta',
    selectedAnswer: voteByParticipant.get(p.id) ?? null,
  }))

  const voteCount = votes.length
  const totalCount = participants.length
  const allVoted = totalCount > 0 && voteCount >= totalCount
  const uniqueAnswers = [...new Set(votes.map(v => v.selectedAnswer))]
  const allAgree = allVoted && uniqueAnswers.length === 1
  const agreedAnswer = allAgree ? uniqueAnswers[0] : null

  return { quizVotes, voteCount, allVoted, allAgree, uniqueAnswers, agreedAnswer }
}

function emptyStatus(): YcEmergencyStatus {
  return {
    status: 'EXPLORING',
    readyCount: 0,
    totalCount: 0,
    waitingFor: [],
    readyNames: [],
    missingCount: 0,
    allReady: false,
    hasMarkedReady: false,
    isQrTrigger: false,
    isCaptain: false,
    retryAvailableAt: null,
    quizExpiresAt: null,
    quizQuestion: null,
    quizFailureReason: null,
    myVote: null,
    hasConfirmedVote: false,
    quizVotes: [],
    voteCount: 0,
    allVoted: false,
    allAgree: false,
    uniqueAnswers: [],
  }
}

export async function buildEmergencyStatus(
  groupId: string,
  challengeSlug: string,
  participantId?: string,
): Promise<YcEmergencyStatus | null> {
  const challenge = await prisma.ycChallenge.findUnique({ where: { slug: challengeSlug } })
  if (!challenge) return null

  const session = await prisma.ycTeamChallengeSession.findUnique({
    where: { groupId_challengeId: { groupId, challengeId: challenge.id } },
    include: {
      readyChecks: { where: { isReady: true }, include: { participant: true } },
      group: { include: { participants: true } },
    },
  })

  if (!session) return emptyStatus()

  if (session.status === 'FAILED' && session.retryAvailableAt && session.retryAvailableAt <= new Date()) {
    await prisma.ycTeamChallengeSession.update({
      where: { id: session.id },
      data: { status: 'WAITING', retryAvailableAt: null },
    })
    session.status = 'WAITING'
  }

  if (
    session.status === 'QUIZ_OPEN' &&
    session.quizOpenedAt &&
    isQuizExpired(session.quizOpenedAt)
  ) {
    const retryAt = await applyQuizTimeout(session.id)
    session.status = 'FAILED'
    session.retryAvailableAt = retryAt
    session.quizOpenedAt = null
  }

  const readyIds = new Set(session.readyChecks.map(r => r.participantId))
  const participants = session.group.participants
  const waitingFor = participants
    .filter(p => !readyIds.has(p.id))
    .map(p => p.name || 'Peserta')
  const readyNames = session.readyChecks.map(r => r.participant?.name || 'Peserta')
  const totalCount = participants.length
  const readyCount = readyIds.size
  const missingCount = Math.max(0, totalCount - readyCount)
  const allReady = totalCount > 0 && readyCount >= totalCount

  const group = await prisma.ycGroup.findUnique({
    where: { id: groupId },
    select: { captainParticipantId: true },
  })

  let quizQuestion: YcEmergencyStatus['quizQuestion'] = null
  let quizExpiresAt: string | null = null
  let quizFailureReason: YcEmergencyStatus['quizFailureReason'] = null

  if (session.status === 'FAILED' && session.currentQuestionId) {
    const lastAttempt = await prisma.ycQuizAttempt.findFirst({
      where: { sessionId: session.id, questionId: session.currentQuestionId },
      orderBy: { attemptedAt: 'desc' },
    })
    quizFailureReason = lastAttempt && !lastAttempt.isCorrect ? 'wrong' : 'timeout'
  }

  if (session.status === 'QUIZ_OPEN' && session.currentQuestionId && session.quizOpenedAt) {
    const q = await prisma.ycQuizQuestion.findUnique({ where: { id: session.currentQuestionId } })
    if (q) {
      quizQuestion = {
        id: q.id,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
      }
      quizExpiresAt = new Date(session.quizOpenedAt.getTime() + QUIZ_MS).toISOString()
    }
  }

  const voteSummary = await getQuizVoteSummary(
    session.id,
    session.status === 'QUIZ_OPEN' ? session.currentQuestionId : null,
    participants,
  )
  const myVoteRecord = participantId
    ? voteSummary.quizVotes.find(v => v.participantId === participantId)
    : null

  return {
    status: session.status,
    readyCount,
    totalCount,
    waitingFor,
    readyNames,
    missingCount,
    allReady,
    hasMarkedReady: participantId ? readyIds.has(participantId) : false,
    isQrTrigger: participantId ? session.triggeredByParticipantId === participantId : false,
    isCaptain: participantId ? group?.captainParticipantId === participantId : false,
    retryAvailableAt: session.retryAvailableAt?.toISOString() ?? null,
    quizExpiresAt,
    quizQuestion,
    quizFailureReason,
    myVote: myVoteRecord?.selectedAnswer ?? null,
    hasConfirmedVote: Boolean(myVoteRecord?.selectedAnswer),
    quizVotes: voteSummary.quizVotes,
    voteCount: voteSummary.voteCount,
    allVoted: voteSummary.allVoted,
    allAgree: voteSummary.allAgree,
    uniqueAnswers: voteSummary.uniqueAnswers,
  }
}

export async function getActiveEmergency(groupId: string): Promise<YcEmergencyActive> {
  const session = await prisma.ycTeamChallengeSession.findFirst({
    where: {
      groupId,
      status: { in: ['EMERGENCY', 'WAITING', 'QUIZ_OPEN', 'FAILED'] },
    },
    include: { challenge: true },
    orderBy: { emergencyCalledAt: 'desc' },
  })

  if (!session) {
    return {
      active: false,
      challengeSlug: null,
      challengeTitle: null,
      status: null,
      emergencyCalledAt: null,
    }
  }

  return {
    active: true,
    challengeSlug: session.challenge.slug,
    challengeTitle: session.challenge.title,
    status: session.status,
    emergencyCalledAt: session.emergencyCalledAt?.toISOString() ?? null,
  }
}

export async function adminForceOpenQuiz(groupId: string, challengeId: string) {
  const question = await pickRandomQuestion(challengeId)
  if (!question) throw new Error('Belum ada soal quiz')

  await prisma.ycTeamChallengeSession.upsert({
    where: { groupId_challengeId: { groupId, challengeId } },
    create: {
      groupId,
      challengeId,
      status: 'QUIZ_OPEN',
      emergencyCalledAt: new Date(),
      currentQuestionId: question.id,
      quizOpenedAt: new Date(),
    },
    update: {
      status: 'QUIZ_OPEN',
      currentQuestionId: question.id,
      quizOpenedAt: new Date(),
      retryAvailableAt: null,
    },
  })
}

export async function submitQuizAnswer(
  sessionId: string,
  questionId: string,
  _selectedAnswer: string,
  participantId: string,
) {
  const session = await prisma.ycTeamChallengeSession.findUnique({
    where: { id: sessionId },
    include: { challenge: true, group: { include: { participants: true } } },
  })
  if (!session) throw new Error('Session tidak ditemukan')

  const canSubmit =
    session.group.captainParticipantId === participantId ||
    session.triggeredByParticipantId === participantId ||
    !session.group.captainParticipantId

  if (!canSubmit) {
    throw new Error('Hanya captain atau pemindai QR yang bisa submit jawaban')
  }

  if (session.status === 'FAILED') {
    if (session.retryAvailableAt && session.retryAvailableAt > new Date()) {
      throw new Error('Tunggu sebelum mencoba lagi')
    }
    await prisma.ycTeamChallengeSession.update({
      where: { id: sessionId },
      data: { status: 'WAITING', retryAvailableAt: null },
    })
    throw new Error('Quiz perlu dibuka ulang oleh pemindai QR')
  }

  if (session.status !== 'QUIZ_OPEN') {
    throw new Error('Quiz belum terbuka')
  }

  return finalizeQuizFromVotes(sessionId, questionId, participantId)
}
