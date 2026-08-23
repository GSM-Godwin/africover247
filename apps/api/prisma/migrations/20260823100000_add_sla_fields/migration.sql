ALTER TABLE "SupportTicket" ADD COLUMN "slaDeadline" TIMESTAMP(3);
ALTER TABLE "SupportTicket" ADD COLUMN "slaBreached" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SupportTicket" ADD COLUMN "slaBreachNotified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SupportTicket" ADD COLUMN "firstResponseAt" TIMESTAMP(3);
