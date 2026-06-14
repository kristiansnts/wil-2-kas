-- AlterTable
ALTER TABLE "YcFormSubmission" ADD COLUMN "participantId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "YcFormSubmission_participantId_key" ON "YcFormSubmission"("participantId");

-- AddForeignKey
ALTER TABLE "YcFormSubmission" ADD CONSTRAINT "YcFormSubmission_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "YcParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
