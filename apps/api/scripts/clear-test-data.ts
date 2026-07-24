import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing test data...');

  await prisma.notification.deleteMany({});
  console.log('Notifications cleared');

  await prisma.claimComment.deleteMany({});
  await prisma.claimStatusHistory.deleteMany({});
  await prisma.claimDocument.deleteMany({});
  await prisma.claim.deleteMany({});
  console.log('Claims cleared');

  await prisma.kycDocument.deleteMany({});
  console.log('KYC documents cleared');

  await prisma.policy.deleteMany({});
  console.log('Policies cleared');

  await prisma.payment.deleteMany({});
  console.log('Payments cleared');

  await prisma.application.deleteMany({});
  console.log('Applications cleared');

  await prisma.quote.deleteMany({});
  console.log('Quotes cleared');

  await prisma.product.deleteMany({});
  console.log('Products cleared');

  console.log('All test data cleared successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
