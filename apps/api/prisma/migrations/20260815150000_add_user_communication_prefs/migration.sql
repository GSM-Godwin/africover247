ALTER TABLE "User" ADD COLUMN "preferredChannel" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "User" ADD COLUMN "renewalReminderPref" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "User" ADD COLUMN "reminderSnoozedUntil" TIMESTAMP(3);
