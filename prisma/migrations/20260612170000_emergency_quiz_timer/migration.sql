-- AlterTable
ALTER TABLE "YcTeamChallengeSession" ADD COLUMN "currentQuestionId" TEXT,
ADD COLUMN "quizOpenedAt" TIMESTAMP(3),
ADD COLUMN "triggeredByParticipantId" TEXT;

-- AddForeignKey
ALTER TABLE "YcTeamChallengeSession" ADD CONSTRAINT "YcTeamChallengeSession_triggeredByParticipantId_fkey" FOREIGN KEY ("triggeredByParticipantId") REFERENCES "YcParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
