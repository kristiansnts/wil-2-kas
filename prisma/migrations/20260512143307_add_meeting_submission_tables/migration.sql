-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastorSubmission" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "pastorId" TEXT NOT NULL,
    "persepuluhan" INTEGER NOT NULL DEFAULT 0,
    "bulan" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PastorSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WadahEntry" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "WadahEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_token_key" ON "Meeting"("token");

-- AddForeignKey
ALTER TABLE "PastorSubmission" ADD CONSTRAINT "PastorSubmission_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastorSubmission" ADD CONSTRAINT "PastorSubmission_pastorId_fkey" FOREIGN KEY ("pastorId") REFERENCES "Pastor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WadahEntry" ADD CONSTRAINT "WadahEntry_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "PastorSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
