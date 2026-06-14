-- CreateTable
CREATE TABLE "YcQuizVote" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YcQuizVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YcQuizVote_sessionId_participantId_key" ON "YcQuizVote"("sessionId", "participantId");

-- AddForeignKey
ALTER TABLE "YcQuizVote" ADD CONSTRAINT "YcQuizVote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "YcTeamChallengeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcQuizVote" ADD CONSTRAINT "YcQuizVote_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "YcParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
