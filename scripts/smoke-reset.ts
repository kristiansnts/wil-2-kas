import 'dotenv/config'
import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { getDatabaseUrl } from '../lib/database-url'
import {
  SMOKE_GROUP_IDS,
  SMOKE_PARTICIPANT_IDS,
  SMOKE_PREFIX,
} from '../tests/helpers/constants'

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Resetting YC smoke test data...\n')

  const formDeleted = await prisma.ycFormSubmission.deleteMany({
    where: { answer: { startsWith: SMOKE_PREFIX } },
  })
  console.log(`YcFormSubmission: ${formDeleted.count}`)

  const stories = await prisma.ycNametagStory.deleteMany({
    where: {
      OR: [
        { authorParticipantId: { in: [...SMOKE_PARTICIPANT_IDS] } },
        { storyText: { startsWith: SMOKE_PREFIX } },
      ],
    },
  })
  console.log(`YcNametagStory: ${stories.count}`)

  const pairings = await prisma.ycNametagPairing.deleteMany({
    where: {
      OR: [
        { participantLowId: { in: [...SMOKE_PARTICIPANT_IDS] } },
        { participantHighId: { in: [...SMOKE_PARTICIPANT_IDS] } },
      ],
    },
  })
  console.log(`YcNametagPairing: ${pairings.count}`)

  for (const groupId of SMOKE_GROUP_IDS) {
    const sessions = await prisma.ycTeamChallengeSession.findMany({
      where: { groupId },
      select: { id: true },
    })
    const sessionIds = sessions.map(s => s.id)
    if (sessionIds.length > 0) {
      await prisma.ycQuizVote.deleteMany({ where: { sessionId: { in: sessionIds } } })
      await prisma.ycQuizAttempt.deleteMany({ where: { sessionId: { in: sessionIds } } })
      await prisma.ycTeamReadyCheck.deleteMany({ where: { sessionId: { in: sessionIds } } })
      await prisma.ycTeamChallengeSession.deleteMany({ where: { id: { in: sessionIds } } })
      console.log(`YcTeamChallengeSession (${groupId}): ${sessionIds.length}`)
    }
  }

  const galleryDeleted = await prisma.ycGalleryUpload.deleteMany({
    where: {
      OR: [
        { caption: { startsWith: SMOKE_PREFIX } },
        { participantId: { in: [...SMOKE_PARTICIPANT_IDS] } },
      ],
    },
  })
  console.log(`YcGalleryUpload: ${galleryDeleted.count}`)

  const challengeDeleted = await prisma.ycChallengeSubmission.deleteMany({
    where: {
      OR: [
        { answerText: { startsWith: SMOKE_PREFIX } },
        { participantId: { in: [...SMOKE_PARTICIPANT_IDS] } },
      ],
    },
  })
  console.log(`YcChallengeSubmission: ${challengeDeleted.count}`)

  await prisma.ycGroup.updateMany({
    where: { id: { in: [...SMOKE_GROUP_IDS] } },
    data: {
      captainParticipantId: null,
      contentCreatorParticipantId: null,
      points: 0,
    },
  })

  for (const id of SMOKE_GROUP_IDS) {
    const slug = id === 'team-smoke' ? 'team-smoke' : 'team-smoke-b'
    await prisma.ycGroup.update({
      where: { id },
      data: { name: slug },
    })
  }
  console.log('YcGroup: reset captain/CC/points/name')

  const participantsReset = await prisma.ycParticipant.updateMany({
    where: { id: { in: [...SMOKE_PARTICIPANT_IDS] } },
    data: {
      name: null,
      gender: null,
      churchName: null,
      instagram: null,
      tiktok: null,
      isSubmitForm: false,
    },
  })
  console.log(`YcParticipant: ${participantsReset.count}`)

  console.log('\nDone.')
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
