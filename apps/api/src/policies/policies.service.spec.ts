jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));

import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PoliciesService } from './policies.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { StorageService } from '../storage/storage.service';
import { ApplicationsService } from '../applications/applications.service';
import { PremiumService } from '../premium/premium.service';

const APPLICATION_ID = 'application-1';
const PAYMENT_ID = 'payment-1';

function policyNumberConflict() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '6.19.3',
    meta: { target: ['policyNumber'] },
  });
}

function buildApplication(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: APPLICATION_ID,
    userId: 'user-1',
    productId: 'product-1',
    formData: { calculatedPremium: '1' },
    assetDetails: { vehicleValue: '1000000' },
    user: {
      id: 'user-1',
      firstName: 'Ada',
      lastName: 'Okafor',
      email: 'ada@example.com',
      phone: null,
    },
    product: {
      id: 'product-1',
      name: 'Motor Comprehensive',
      category: 'Motor',
      durationMonths: 12,
      premiumAmount: null,
      pricingType: 'calculable',
      rate: '0.05',
      assetFields: [{ key: 'vehicleValue' }],
      coverageHighlights: 'Accident cover\nTheft cover',
      exclusions: 'Racing\nWar',
    },
    ...overrides,
  };
}

describe('PoliciesService', () => {
  let service: PoliciesService;
  let prisma: {
    application: { findUnique: jest.Mock };
    policy: { findUnique: jest.Mock };
    payment: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    notification: { create: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    payment: { update: jest.Mock };
    policy: { create: jest.Mock };
    application: { update: jest.Mock };
  };
  let storageService: { uploadPdf: jest.Mock };
  let applicationsService: { clearDraft: jest.Mock };
  let emailService: { sendPolicyIssuedEmail: jest.Mock };
  let smsService: { sendPolicyIssuedSms: jest.Mock };
  let adminService: { createAuditLog: jest.Mock };

  beforeEach(async () => {
    tx = {
      payment: { update: jest.fn().mockResolvedValue({}) },
      policy: { create: jest.fn() },
      application: { update: jest.fn().mockResolvedValue({}) },
    };
    prisma = {
      application: { findUnique: jest.fn() },
      policy: { findUnique: jest.fn().mockResolvedValue(null) },
      payment: { findUnique: jest.fn().mockResolvedValue({ gatewayReference: 'ref-1' }) },
      user: { findUnique: jest.fn().mockResolvedValue({ pushToken: null }) },
      notification: { create: jest.fn() },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx)),
    };
    storageService = { uploadPdf: jest.fn().mockResolvedValue('https://cdn.example.com/policy.pdf') };
    applicationsService = { clearDraft: jest.fn() };
    emailService = { sendPolicyIssuedEmail: jest.fn() };
    smsService = { sendPolicyIssuedSms: jest.fn() };
    adminService = { createAuditLog: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoliciesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AdminService, useValue: adminService },
        { provide: EmailService, useValue: emailService },
        { provide: SmsService, useValue: smsService },
        { provide: StorageService, useValue: storageService },
        { provide: ApplicationsService, useValue: applicationsService },
        PremiumService,
      ],
    }).compile();

    service = module.get(PoliciesService);
  });

  describe('generatePolicy', () => {
    it('creates the policy on the first attempt when the policy number is unique', async () => {
      prisma.application.findUnique.mockResolvedValue(buildApplication());
      tx.policy.create.mockResolvedValue({ id: 'policy-1', policyNumber: 'AFC-2026-100001' });

      await service.generatePolicy(APPLICATION_ID, PAYMENT_ID, { stub: true });

      expect(tx.policy.create).toHaveBeenCalledTimes(1);
      expect(tx.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PAYMENT_ID },
          data: expect.objectContaining({ status: 'successful' }),
        }),
      );
      expect(tx.application.update).toHaveBeenCalledWith({
        where: { id: APPLICATION_ID },
        data: { status: 'issued' },
      });
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('retries with a new policy number on a P2002 conflict and eventually succeeds', async () => {
      prisma.application.findUnique.mockResolvedValue(buildApplication());
      tx.policy.create
        .mockRejectedValueOnce(policyNumberConflict())
        .mockRejectedValueOnce(policyNumberConflict())
        .mockResolvedValueOnce({ id: 'policy-1', policyNumber: 'AFC-2026-100099' });

      await service.generatePolicy(APPLICATION_ID, PAYMENT_ID, { stub: true });

      expect(tx.policy.create).toHaveBeenCalledTimes(3);
      expect(tx.application.update).toHaveBeenCalledWith({
        where: { id: APPLICATION_ID },
        data: { status: 'issued' },
      });
    });

    it('stops retrying after the retry limit and does not mark the payment path as issued', async () => {
      prisma.application.findUnique.mockResolvedValue(buildApplication());
      tx.policy.create.mockRejectedValue(policyNumberConflict());

      await expect(
        service.generatePolicy(APPLICATION_ID, PAYMENT_ID, { stub: true }),
      ).rejects.toThrow();

      expect(tx.policy.create).toHaveBeenCalledTimes(6);
      expect(tx.application.update).not.toHaveBeenCalled();
      expect(applicationsService.clearDraft).not.toHaveBeenCalled();
    });

    it('does not retry on a conflict unrelated to the policy number', async () => {
      prisma.application.findUnique.mockResolvedValue(buildApplication());
      const otherConflict = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.19.3', meta: { target: ['applicationId'] } },
      );
      tx.policy.create.mockRejectedValue(otherConflict);

      await expect(
        service.generatePolicy(APPLICATION_ID, PAYMENT_ID, { stub: true }),
      ).rejects.toThrow();

      expect(tx.policy.create).toHaveBeenCalledTimes(1);
    });

    it('runs the payment update and the policy creation inside the same transaction', async () => {
      prisma.application.findUnique.mockResolvedValue(buildApplication());
      tx.policy.create.mockResolvedValue({ id: 'policy-1', policyNumber: 'AFC-2026-100001' });

      await service.generatePolicy(APPLICATION_ID, PAYMENT_ID, { stub: true });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const paymentUpdateOrder = tx.payment.update.mock.invocationCallOrder[0];
      const policyCreateOrder = tx.policy.create.mock.invocationCallOrder[0];
      expect(paymentUpdateOrder).toBeLessThan(policyCreateOrder);
    });

    it('does nothing when a policy already exists for the application', async () => {
      prisma.application.findUnique.mockResolvedValue(buildApplication());
      prisma.policy.findUnique.mockResolvedValue({ id: 'existing-policy' });

      await service.generatePolicy(APPLICATION_ID, PAYMENT_ID, { stub: true });

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('does nothing when the application cannot be found', async () => {
      prisma.application.findUnique.mockResolvedValue(null);

      await service.generatePolicy(APPLICATION_ID, PAYMENT_ID, { stub: true });

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('does nothing when no premium amount can be resolved', async () => {
      prisma.application.findUnique.mockResolvedValue(
        buildApplication({
          formData: {},
          product: {
            id: 'product-1',
            name: 'Motor Comprehensive',
            category: 'Motor',
            durationMonths: 12,
            premiumAmount: null,
            coverageHighlights: 'Accident cover',
            exclusions: 'Racing',
          },
        }),
      );

      await service.generatePolicy(APPLICATION_ID, PAYMENT_ID, { stub: true });

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(storageService.uploadPdf).not.toHaveBeenCalled();
    });

    it('records the server-calculated premium, ignoring the calculatedPremium stored in formData', async () => {
      prisma.application.findUnique.mockResolvedValue(buildApplication());
      tx.policy.create.mockResolvedValue({ id: 'policy-1', policyNumber: 'AFC-2026-100001' });

      await service.generatePolicy(APPLICATION_ID, PAYMENT_ID, { stub: true });

      expect(tx.policy.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ premiumPaid: 50000 }) }),
      );
    });

    it('uses the product premium amount over the calculated premium when both are present', async () => {
      prisma.application.findUnique.mockResolvedValue(
        buildApplication({
          formData: { calculatedPremium: '999999' },
          product: {
            id: 'product-1',
            name: 'Motor Comprehensive',
            category: 'Motor',
            durationMonths: 12,
            premiumAmount: 60000,
            coverageHighlights: 'Accident cover',
            exclusions: 'Racing',
          },
        }),
      );
      tx.policy.create.mockResolvedValue({ id: 'policy-1', policyNumber: 'AFC-2026-100001' });

      await service.generatePolicy(APPLICATION_ID, PAYMENT_ID, { stub: true });

      expect(tx.policy.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ premiumPaid: 60000 }) }),
      );
    });
  });
});
