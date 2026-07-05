import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.product.createMany({
    data: [
      {
        name: 'Motor Insurance',
        category: 'Motor',
        description:
          'Comprehensive motor vehicle insurance covering accident, theft, and third-party liability.',
        premiumAmount: 45000,
        premiumFrequency: 'annual',
        durationMonths: 12,
        coverageHighlights:
          'Accident damage\nTheft and fire\nThird-party liability\nRoadside assistance',
        exclusions:
          'Drunk driving incidents\nRacing or motorsport use\nWear and tear',
        requiredDocuments:
          'Government-issued ID\nProof of address\nVehicle registration document\nPassport photograph',
        status: 'active',
      },
      {
        name: 'Health Insurance',
        category: 'Health',
        description:
          'Individual health insurance covering hospitalisation, outpatient care, and emergency treatment.',
        premiumAmount: 72000,
        premiumFrequency: 'annual',
        durationMonths: 12,
        coverageHighlights:
          'Hospitalisation\nOutpatient consultations\nEmergency treatment\nPrescription drugs',
        exclusions:
          'Pre-existing conditions (first year)\nCosmetic procedures\nDental (unless emergency)',
        requiredDocuments:
          'Government-issued ID\nProof of address\nPassport photograph\nMedical history form',
        status: 'active',
      },
      {
        name: 'SSLAG Group Life Insurance',
        category: 'SSLAG/SSPP',
        description:
          'Lagos State Social Protection Programme group life insurance for public sector employees.',
        premiumAmount: 18000,
        premiumFrequency: 'annual',
        durationMonths: 12,
        coverageHighlights:
          'Life cover up to ₦5,000,000\nAccidental death benefit\nPermanent disability cover\nFuneral assistance',
        exclusions:
          'Suicide within first year\nSelf-inflicted injuries\nActs of war',
        requiredDocuments:
          'Government-issued ID\nProof of address\nPassport photograph\nBeneficiary details',
        status: 'active',
      },
    ],
    skipDuplicates: true,
  });

  const passwordHash = await bcrypt.hash('Admin@123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@africover247.com' },
    update: {},
    create: {
      firstName: 'AfriCover',
      lastName: 'Admin',
      email: 'admin@africover247.com',
      passwordHash,
      role: 'admin',
      emailVerified: true,
    },
  });

  console.log('Seed complete. Admin: admin@africover247.com / Admin@123456');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
