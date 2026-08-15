-- AlterEnum
ALTER TYPE "PolicyStatus" ADD VALUE IF NOT EXISTS 'renewal_due';
ALTER TYPE "PolicyStatus" ADD VALUE IF NOT EXISTS 'renewal_in_progress';
ALTER TYPE "PolicyStatus" ADD VALUE IF NOT EXISTS 'renewed';
ALTER TYPE "PolicyStatus" ADD VALUE IF NOT EXISTS 'non_renewed';
ALTER TYPE "PolicyStatus" ADD VALUE IF NOT EXISTS 'pending_underwriting';

-- AlterTable
ALTER TABLE "Policy" ADD COLUMN "renewalStatus" TEXT NOT NULL DEFAULT 'NOT_YET_DUE';
ALTER TABLE "Policy" ADD COLUMN "lastReminderSentAt" TIMESTAMP(3);
ALTER TABLE "Policy" ADD COLUMN "lastReminderType" TEXT;
ALTER TABLE "Policy" ADD COLUMN "remindersSupressed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RenewalLog" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "channels" TEXT[],
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenewalLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RenewalLog_policyId_idx" ON "RenewalLog"("policyId");

-- CreateIndex
CREATE INDEX "RenewalLog_sentAt_idx" ON "RenewalLog"("sentAt");

-- AddForeignKey
ALTER TABLE "RenewalLog" ADD CONSTRAINT "RenewalLog_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
