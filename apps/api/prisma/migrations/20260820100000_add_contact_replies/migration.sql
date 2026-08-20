-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN "replied" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ContactMessage" ADD COLUMN "repliedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ContactReply" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactReply_messageId_idx" ON "ContactReply"("messageId");

-- AddForeignKey
ALTER TABLE "ContactReply" ADD CONSTRAINT "ContactReply_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ContactMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
