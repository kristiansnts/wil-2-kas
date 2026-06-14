-- CreateTable
CREATE TABLE "YcFormSubmission" (
    "id" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YcFormSubmission_pkey" PRIMARY KEY ("id")
);
