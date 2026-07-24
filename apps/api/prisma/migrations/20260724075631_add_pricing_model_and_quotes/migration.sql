/*
  Warnings:

  - You are about to drop the column `premiumFrequency` on the `Product` table. All the data in the column will be lost.
  - The `status` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `exclusions` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `requiredDocuments` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('fixed', 'calculable', 'quote_based');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('pending_review', 'quote_sent', 'countered_by_customer', 'countered_by_admin', 'accepted', 'rejected', 'expired');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "assetDetails" JSONB;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "quoteId" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "premiumFrequency",
ADD COLUMN     "assetFields" JSONB,
ADD COLUMN     "calculationBasis" TEXT,
ADD COLUMN     "pricingType" "PricingType" NOT NULL DEFAULT 'fixed',
ADD COLUMN     "rate" DECIMAL(65,30),
ADD COLUMN     "rateMax" DECIMAL(65,30),
ADD COLUMN     "rateMin" DECIMAL(65,30),
ALTER COLUMN "premiumAmount" DROP NOT NULL,
ALTER COLUMN "exclusions" SET NOT NULL,
ALTER COLUMN "requiredDocuments" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- DropEnum
DROP TYPE "ProductStatus";

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'pending_review',
    "customerDetails" JSONB NOT NULL,
    "adminQuoteAmount" DECIMAL(65,30),
    "adminNote" TEXT,
    "customerCounterAmount" DECIMAL(65,30),
    "customerNote" TEXT,
    "negotiationHistory" JSONB NOT NULL DEFAULT '[]',
    "finalAmount" DECIMAL(65,30),
    "roundsUsed" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
