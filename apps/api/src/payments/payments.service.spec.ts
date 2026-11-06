jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { MonnifyService } from './monnify.service';
import { PoliciesService } from '../policies/policies.service';
import { ApplicationsService } from '../applications/applications.service';

const PAYMENT_ID = '11111111-2222-3333-4444-555555555555';
const APPLICATION_ID = 'app-id-1';

function buildWebhookPayload(eventType: string, paymentReference: string) {
  return JSON.stringify({
    eventType,
    eventData: {
      paymentReference,
      amountPaid: 5000,
      paymentStatus: 'PAID',
    },
  });
}

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: {
    payment: { findUnique: jest.Mock; update: jest.Mock };
    application: { findUnique: jest.Mock; update: jest.Mock };
  };
  let monnifyService: {
    verifyWebhookSignature: jest.Mock;
    isStubMode: jest.Mock;
    verifyTransaction: jest.Mock;
  };
  let policiesService: { generatePolicy: jest.Mock };

  beforeEach(async () => {
    prisma = {
      payment: { findUnique: jest.fn(), update: jest.fn() },
      application: { findUnique: jest.fn(), update: jest.fn() },
    };
    monnifyService = {
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
      isStubMode: jest.fn().mockReturnValue(false),
      verifyTransaction: jest.fn(),
    };
    policiesService = { generatePolicy: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MonnifyService, useValue: monnifyService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: PoliciesService, useValue: policiesService },
        { provide: ApplicationsService, useValue: { clearDraft: jest.fn() } },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  function mockPendingPayment(overrides: Partial<Record<string, unknown>> = {}) {
    prisma.payment.findUnique.mockResolvedValue({
      id: PAYMENT_ID,
      applicationId: APPLICATION_ID,
      amount: 5000,
      status: 'pending',
      gatewayReference: `${PAYMENT_ID}-1700000000000`,
      ...overrides,
    });
  }

  describe('handleWebhook signature check', () => {
    it('rejects when the signature is invalid or missing', async () => {
      monnifyService.verifyWebhookSignature.mockReturnValue(false);
      const payload = buildWebhookPayload(
        'SUCCESSFUL_TRANSACTION',
        `${PAYMENT_ID}-1700000000000`,
      );

      await expect(service.handleWebhook(payload, '')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(policiesService.generatePolicy).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook successful transaction', () => {
    it('issues the policy once Monnify verification confirms PAID and a matching amount', async () => {
      mockPendingPayment();
      monnifyService.verifyTransaction.mockResolvedValue({
        status: 'PAID',
        amount: 5000,
        reference: `${PAYMENT_ID}-1700000000000`,
        gatewayResponse: { verified: true },
      });

      const payload = buildWebhookPayload(
        'SUCCESSFUL_TRANSACTION',
        `${PAYMENT_ID}-1700000000000`,
      );
      await service.handleWebhook(payload, 'valid-signature');

      expect(policiesService.generatePolicy).toHaveBeenCalledWith(
        APPLICATION_ID,
        PAYMENT_ID,
        { verified: true },
      );
    });

    it('refuses to issue the policy when the verified amount does not match the expected amount', async () => {
      mockPendingPayment({ amount: 5000 });
      monnifyService.verifyTransaction.mockResolvedValue({
        status: 'PAID',
        amount: 1000,
        reference: `${PAYMENT_ID}-1700000000000`,
        gatewayResponse: { verified: true },
      });

      const payload = buildWebhookPayload(
        'SUCCESSFUL_TRANSACTION',
        `${PAYMENT_ID}-1700000000000`,
      );
      await service.handleWebhook(payload, 'valid-signature');

      expect(policiesService.generatePolicy).not.toHaveBeenCalled();
    });

    it('refuses to issue the policy when the verified status is not PAID', async () => {
      mockPendingPayment();
      monnifyService.verifyTransaction.mockResolvedValue({
        status: 'FAILED',
        amount: 5000,
        reference: `${PAYMENT_ID}-1700000000000`,
        gatewayResponse: { verified: true },
      });

      const payload = buildWebhookPayload(
        'SUCCESSFUL_TRANSACTION',
        `${PAYMENT_ID}-1700000000000`,
      );
      await service.handleWebhook(payload, 'valid-signature');

      expect(policiesService.generatePolicy).not.toHaveBeenCalled();
    });

    it('skips processing entirely for an already-successful payment (idempotency)', async () => {
      mockPendingPayment({ status: 'successful' });

      const payload = buildWebhookPayload(
        'SUCCESSFUL_TRANSACTION',
        `${PAYMENT_ID}-1700000000000`,
      );
      await service.handleWebhook(payload, 'valid-signature');

      expect(monnifyService.verifyTransaction).not.toHaveBeenCalled();
      expect(policiesService.generatePolicy).not.toHaveBeenCalled();
    });

    it('does nothing when the payment referenced by the webhook cannot be found', async () => {
      prisma.payment.findUnique.mockResolvedValue(null);

      const payload = buildWebhookPayload(
        'SUCCESSFUL_TRANSACTION',
        `${PAYMENT_ID}-1700000000000`,
      );
      await service.handleWebhook(payload, 'valid-signature');

      expect(policiesService.generatePolicy).not.toHaveBeenCalled();
    });

    it('bypasses Monnify verification in stub mode and issues the policy from the webhook payload', async () => {
      mockPendingPayment();
      monnifyService.isStubMode.mockReturnValue(true);

      const payload = buildWebhookPayload(
        'SUCCESSFUL_TRANSACTION',
        `${PAYMENT_ID}-1700000000000`,
      );
      await service.handleWebhook(payload, 'stub-signature');

      expect(monnifyService.verifyTransaction).not.toHaveBeenCalled();
      expect(policiesService.generatePolicy).toHaveBeenCalledWith(
        APPLICATION_ID,
        PAYMENT_ID,
        expect.objectContaining({ paymentReference: `${PAYMENT_ID}-1700000000000` }),
      );
    });
  });
});
