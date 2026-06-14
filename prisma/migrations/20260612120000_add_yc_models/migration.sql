-- CreateEnum
CREATE TYPE "YcChallengeType" AS ENUM ('INDIVIDUAL', 'TEAM');

-- CreateEnum
CREATE TYPE "YcSubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "YcTeamSessionStatus" AS ENUM ('EXPLORING', 'EMERGENCY', 'WAITING', 'QUIZ_OPEN', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "YcGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sticker" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "captainParticipantId" TEXT,
    "contentCreatorParticipantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YcGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YcParticipant" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT,
    "churchName" TEXT,
    "groupId" TEXT,
    "serviceInterest" JSONB,
    "instagram" TEXT,
    "tiktok" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YcParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YcChallenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "YcChallengeType" NOT NULL,
    "description" TEXT,
    "points" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emergencyQrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YcChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YcChallengeSubmission" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "participantId" TEXT,
    "groupId" TEXT,
    "answerText" TEXT,
    "mediaUrl" TEXT,
    "driveFileId" TEXT,
    "status" "YcSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "YcChallengeSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YcTeamChallengeSession" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "status" "YcTeamSessionStatus" NOT NULL DEFAULT 'EXPLORING',
    "emergencyCalledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "retryAvailableAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YcTeamChallengeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YcTeamReadyCheck" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "readyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YcTeamReadyCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YcQuizQuestion" (
    "id" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YcQuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YcQuizAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "attemptedByParticipantId" TEXT,
    "selectedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YcQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YcGalleryUpload" (
    "id" TEXT NOT NULL,
    "participantId" TEXT,
    "groupId" TEXT,
    "mediaUrl" TEXT NOT NULL,
    "driveFileId" TEXT,
    "caption" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YcGalleryUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YcSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YcSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "YcGroup_captainParticipantId_key" ON "YcGroup"("captainParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "YcGroup_contentCreatorParticipantId_key" ON "YcGroup"("contentCreatorParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "YcParticipant_token_key" ON "YcParticipant"("token");

-- CreateIndex
CREATE UNIQUE INDEX "YcChallenge_slug_key" ON "YcChallenge"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "YcChallenge_emergencyQrCode_key" ON "YcChallenge"("emergencyQrCode");

-- CreateIndex
CREATE UNIQUE INDEX "YcTeamChallengeSession_groupId_challengeId_key" ON "YcTeamChallengeSession"("groupId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "YcTeamReadyCheck_sessionId_participantId_key" ON "YcTeamReadyCheck"("sessionId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "YcSetting_key_key" ON "YcSetting"("key");

-- AddForeignKey
ALTER TABLE "YcGroup" ADD CONSTRAINT "YcGroup_captainParticipantId_fkey" FOREIGN KEY ("captainParticipantId") REFERENCES "YcParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcGroup" ADD CONSTRAINT "YcGroup_contentCreatorParticipantId_fkey" FOREIGN KEY ("contentCreatorParticipantId") REFERENCES "YcParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcParticipant" ADD CONSTRAINT "YcParticipant_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "YcGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcChallengeSubmission" ADD CONSTRAINT "YcChallengeSubmission_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "YcChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcChallengeSubmission" ADD CONSTRAINT "YcChallengeSubmission_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "YcParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcChallengeSubmission" ADD CONSTRAINT "YcChallengeSubmission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "YcGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcTeamChallengeSession" ADD CONSTRAINT "YcTeamChallengeSession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "YcGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcTeamChallengeSession" ADD CONSTRAINT "YcTeamChallengeSession_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "YcChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcTeamReadyCheck" ADD CONSTRAINT "YcTeamReadyCheck_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "YcTeamChallengeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcTeamReadyCheck" ADD CONSTRAINT "YcTeamReadyCheck_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "YcParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcQuizQuestion" ADD CONSTRAINT "YcQuizQuestion_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "YcChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcQuizAttempt" ADD CONSTRAINT "YcQuizAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "YcTeamChallengeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcQuizAttempt" ADD CONSTRAINT "YcQuizAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "YcQuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcQuizAttempt" ADD CONSTRAINT "YcQuizAttempt_attemptedByParticipantId_fkey" FOREIGN KEY ("attemptedByParticipantId") REFERENCES "YcParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcGalleryUpload" ADD CONSTRAINT "YcGalleryUpload_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "YcParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YcGalleryUpload" ADD CONSTRAINT "YcGalleryUpload_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "YcGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
