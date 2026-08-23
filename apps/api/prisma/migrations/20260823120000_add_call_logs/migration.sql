CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'outbound',
    "duration" INTEGER,
    "topic" TEXT NOT NULL,
    "notes" TEXT,
    "outcome" TEXT NOT NULL,
    "calledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CallLog_adminId_idx" ON "CallLog"("adminId");
CREATE INDEX "CallLog_calledAt_idx" ON "CallLog"("calledAt");

ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
