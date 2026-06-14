-- CreateEnum
CREATE TYPE "YcGender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "YcParticipant" ADD COLUMN "gender" "YcGender";
