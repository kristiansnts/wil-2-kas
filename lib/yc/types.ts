import type { ServiceInterest, YcGender } from './constants'

export type YcGroupSummary = {
  id: string
  slug: string
  name: string
  points: number
}

export type YcParticipantFeatureFlags = {
  emergencyAlarm: boolean
  teamChallenge: boolean
  nametagPairing: boolean
  worshipForm: boolean
}

export type YcParticipantIndividualPoints = {
  upload: number
  extrovert: number
  total: number
}

export type YcParticipantPublic = {
  id: string
  token: string
  name: string | null
  gender: YcGender | null
  churchName: string | null
  church: string | null
  instagram: string | null
  tiktok: string | null
  serviceInterest: ServiceInterest[] | null
  group: YcGroupSummary | null
}

export type YcGroupDetail = YcGroupSummary & {
  captain: { id: string; name: string } | null
  contentCreator: { id: string; name: string } | null
  members: { id: string; name: string | null; token: string }[]
}

export type YcChallengeListItem = {
  id: string
  title: string
  slug: string
  type: 'INDIVIDUAL' | 'TEAM'
  description: string | null
  points: number
  isActive: boolean
  completed: boolean
  submissionStatus: string | null
  /** Repeatable challenge — link langsung ke dokumentasi */
  isDocumentationChallenge?: boolean
  /** Repeatable nametag pairing challenge */
  isExtrovertChallenge?: boolean
  /** Outbound — main di lokasi pos, tanpa scan QR */
  isOutboundChallenge?: boolean
  uploadCount?: number
  totalPointsEarned?: number
}

export type YcEmergencyStatus = {
  status: string
  readyCount: number
  totalCount: number
  waitingFor: string[]
  readyNames: string[]
  missingCount: number
  allReady: boolean
  hasMarkedReady: boolean
  isQrTrigger: boolean
  isCaptain: boolean
  retryAvailableAt: string | null
  quizExpiresAt: string | null
  quizQuestion: {
    id: string
    question: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
  } | null
  quizFailureReason: 'wrong' | 'timeout' | null
  myVote: string | null
  hasConfirmedVote: boolean
  quizVotes: {
    participantId: string
    name: string
    selectedAnswer: string | null
  }[]
  voteCount: number
  allVoted: boolean
  allAgree: boolean
  uniqueAnswers: string[]
}

export type YcEmergencyActive = {
  active: boolean
  challengeSlug: string | null
  challengeTitle: string | null
  status: string | null
  emergencyCalledAt: string | null
}

export type YcLeaderboardEntry = {
  rank: number
  id: string
  slug: string
  name: string
  points: number
  memberCount: number
}

export type YcAdminParticipantRank = {
  rank: number
  id: string
  name: string
  groupName: string | null
  points: number
  count?: number
}

export type YcAdminGroupRank = {
  rank: number
  id: string
  slug: string
  name: string
  points: number
  detail?: string
}

export type YcAdminRankings = {
  tukangNgonten: YcAdminParticipantRank[]
  extrovert: YcAdminParticipantRank[]
  outbound: YcAdminGroupRank[]
  teamActivity: YcAdminGroupRank[]
}

export type NametagPairingView = {
  id: string
  status: 'OPEN' | 'COMPLETED'
  partner: {
    id: string
    name: string | null
    churchName: string | null
  }
  myStorySubmitted: boolean
  partnerStorySubmitted: boolean
  myStoryText: string | null
  myCharCount: number | null
  myPointsAwarded: number | null
  partnerPointsAwarded: number | null
  completedAt: string | null
}
