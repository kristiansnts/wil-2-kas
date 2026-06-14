-- CreateEnum
CREATE TYPE "YcGalleryUploadStatus" AS ENUM ('QUEUED', 'UPLOADING', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'FAILED');

-- AlterTable
ALTER TABLE "YcGalleryUpload" ADD COLUMN "uploadType" TEXT NOT NULL DEFAULT 'personal',
ADD COLUMN "status" "YcGalleryUploadStatus" NOT NULL DEFAULT 'QUEUED',
ADD COLUMN "originalFilename" TEXT,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "fileSizeBytes" INTEGER,
ADD COLUMN "reviewComment" TEXT,
ADD COLUMN "errorMessage" TEXT,
ADD COLUMN "submissionId" TEXT,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Make mediaUrl nullable (queued jobs have no file yet)
ALTER TABLE "YcGalleryUpload" ALTER COLUMN "mediaUrl" DROP NOT NULL;

-- Existing uploads were auto-approved before this migration
UPDATE "YcGalleryUpload" SET "status" = 'APPROVED' WHERE "mediaUrl" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "YcGalleryUpload_submissionId_key" ON "YcGalleryUpload"("submissionId");

-- AddForeignKey
ALTER TABLE "YcGalleryUpload" ADD CONSTRAINT "YcGalleryUpload_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "YcChallengeSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
