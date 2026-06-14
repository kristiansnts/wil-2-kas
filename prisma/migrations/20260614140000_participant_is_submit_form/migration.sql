-- AlterTable
ALTER TABLE "YcParticipant" ADD COLUMN "isSubmitForm" BOOLEAN NOT NULL DEFAULT false;

-- Backfill from prior participantId links (if any)
UPDATE "YcParticipant" p
SET "isSubmitForm" = true
WHERE EXISTS (
  SELECT 1 FROM "YcFormSubmission" f WHERE f."participantId" = p.id
);

-- DropForeignKey
ALTER TABLE "YcFormSubmission" DROP CONSTRAINT "YcFormSubmission_participantId_fkey";

-- DropIndex
DROP INDEX "YcFormSubmission_participantId_key";

-- AlterTable
ALTER TABLE "YcFormSubmission" DROP COLUMN "participantId";
