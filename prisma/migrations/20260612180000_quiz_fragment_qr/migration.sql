-- AlterTable: per-question fragment QR
ALTER TABLE "YcQuizQuestion" ADD COLUMN "fragmentOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "YcQuizQuestion" ADD COLUMN "fragmentQrCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "YcQuizQuestion_fragmentQrCode_key" ON "YcQuizQuestion"("fragmentQrCode");

-- DropIndex + AlterTable: remove single challenge emergency QR
DROP INDEX IF EXISTS "YcChallenge_emergencyQrCode_key";
ALTER TABLE "YcChallenge" DROP COLUMN IF EXISTS "emergencyQrCode";
