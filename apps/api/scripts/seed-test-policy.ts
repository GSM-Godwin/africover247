import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  });
  if (!user) throw new Error('Test user not found');

  const application = await prisma.application.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!application) throw new Error('No application for test user');

  const existing = await prisma.policy.findUnique({
    where: { policyNumber: 'AFC-2026-TEST01' },
  });
  if (existing) {
    console.log(`POLICY_ID=${existing.id}`);
    return;
  }

  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const policy = await prisma.policy.create({
    data: {
      applicationId: application.id,
      userId: user.id,
      productId: application.productId,
      policyNumber: 'AFC-2026-TEST01',
      issueDate: now,
      startDate: now,
      expiryDate,
      premiumPaid: 45000,
      status: 'active',
    },
  });

  console.log(`POLICY_ID=${policy.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
