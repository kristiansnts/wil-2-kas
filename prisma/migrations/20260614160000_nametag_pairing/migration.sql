-- CreateEnum
CREATE TYPE "YcNametagPairingStatus" AS ENUM ('OPEN', 'COMPLETED');

-- CreateTable
CREATE TABLE "YcNametagPairing" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "participantLowId" TEXT NOT NULL,
    "participantHighId" TEXT NOT NULL,
    "initiatedByParticipantId" TEXT NOT NULL,
    "status" "YcNametagPairingStatus" NOT NULL DEFAULT 'OPEN',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YcNametagPairing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YcNametagStory" (
    "id" TEXT NOT NULL,
    "pairingId" TEXT NOT NULL,
    "authorParticipantId" TEXT NOT NULL,
    "storyText" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "submissionId" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YcNametagStory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YcNametagPairing_challengeId_participantLowId_participantHighId_key" ON "YcNametagPairing"("challengeId", "participantLowId", "participantHighId");

-- CreateIndex
CREATE UNIQUE INDEX "YcNametagStory_submissionId_key" ON "YcNametagStory"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "YcNametagStory_pairingId_authorParticipantId_key" ON "YcNametagStory"("pairingId", "authorParticipantId");

-- AddForeignKey
ALTER TABLE "YcNametagPairing" ADD CONSTRAINT "YcNametagPairing_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "YcChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcNametagPairing" ADD CONSTRAINT "YcNametagPairing_participantLowId_fkey" FOREIGN KEY ("participantLowId") REFERENCES "YcParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcNametagPairing" ADD CONSTRAINT "YcNametagPairing_participantHighId_fkey" FOREIGN KEY ("participantHighId") REFERENCES "YcParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcNametagPairing" ADD CONSTRAINT "YcNametagPairing_initiatedByParticipantId_fkey" FOREIGN KEY ("initiatedByParticipantId") REFERENCES "YcParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcNametagStory" ADD CONSTRAINT "YcNametagStory_pairingId_fkey" FOREIGN KEY ("pairingId") REFERENCES "YcNametagPairing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcNametagStory" ADD CONSTRAINT "YcNametagStory_authorParticipantId_fkey" FOREIGN KEY ("authorParticipantId") REFERENCES "YcParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcNametagStory" ADD CONSTRAINT "YcNametagStory_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "YcChallengeSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
