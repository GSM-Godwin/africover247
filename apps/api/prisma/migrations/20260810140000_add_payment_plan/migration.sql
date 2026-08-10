-- CreateEnum
CREATE TYPE "PaymentPlan" AS ENUM ('monthly', 'annual');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN "paymentPlan" "PaymentPlan" NOT NULL DEFAULT 'annual';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "paymentPlan" "PaymentPlan" NOT NULL DEFAULT 'annual';
