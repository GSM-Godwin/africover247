jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { MonnifyService } from './monnify.service';
import { PoliciesService } from '../policies/policies.service';
import { ApplicationsService } from '../applications/applications.service';
import { PremiumService } from '../premium/premium.service';

const PAYMENT_ID = '11111111-2222-3333-4444-555555555555';
const APPLICATION_ID = 'app-id-1';
const USER_ID = 'user-1';

function buildApplication(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: APPLICATION_ID,
    userId: USER_ID,
    productId: 'product-1',
    status: 'draft',
    formData: {},
    assetDetails: null,
    user: { email: 'ada@example.com', firstName: 'Ada', lastName: 'Okafor' },
    product: {
      name: 'Home Insurance',
      pricingType: 'fixed',
      premiumAmount: '5000',
      rate: null,
      assetFields: null,
    },
    ...overrides,
  };
}

function motorApplication(formData: Record<string, unknown> = {}) {
  return buildApplication({
    formData,
    assetDetails: { vehicleValue: '2000000' },
    product: {
      name: 'Motor Comprehensive',
      pricingType: 'calculable',
      premiumAmount: null,
      rate: '0.05',
      assetFields: [{ key: 'vehicleValue' }],
    },
  });
}

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
    payment: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    application: { findUnique: jest.Mock; update: jest.Mock };
    quote: { findFirst: jest.Mock };
  };
  let monnifyService: {
    verifyWebhookSignature: jest.Mock;
    isStubMode: jest.Mock;
    verifyTransaction: jest.Mock;
    initializeTransaction: jest.Mock;
  };
  let policiesService: { generatePolicy: jest.Mock };

  beforeEach(async () => {
    prisma = {
      payment: {
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: PAYMENT_ID, ...data }),
        ),
        update: jest.fn().mockResolvedValue({}),
      },
      application: {
        findUnique: jest.fn().mockResolvedValue(buildApplication()),
        update: jest.fn().mockResolvedValue({}),
      },
      quote: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    monnifyService = {
      verifyWebhookSignature: jest.fn().mockReturnValue(true),
      isStubMode: jest.fn().mockReturnValue(false),
      verifyTransaction: jest.fn(),
      initializeTransaction: jest
        .fn()
        .mockResolvedValue({ checkoutUrl: 'https://checkout.example.com' }),
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
        PremiumService,
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  function mockPendingPayment(overrides: Partial<Record<string, unknown>> = {}) {
    prisma.payment.findUnique.mockResolvedValue({
      id: PAYMENT_ID,
      applicationId: APPLICATION_ID,
      amount: 5000,
      paymentPlan: 'annual',
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

  describe('initiatePayment amount', () => {
    it('charges the server-calculated premium, ignoring premium values in formData', async () => {
      prisma.application.findUnique.mockResolvedValue(
        motorApplication({ calculatedPremium: 1, quotedPremium: 1 }),
      );

      const result = await service.initiatePayment(USER_ID, {
        applicationId: APPLICATION_ID,
        paymentPlan: 'annual',
      });

      expect(result.amount).toBe(100000);
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ amount: 100000, paymentPlan: 'annual' }),
      });
      expect(monnifyService.initializeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 100000 }),
      );
    });

    it('corrects an existing pending payment created with a tampered amount', async () => {
      prisma.application.findUnique.mockResolvedValue(motorApplication({ calculatedPremium: 1 }));
      prisma.payment.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: PAYMENT_ID,
        amount: 1,
        paymentPlan: 'annual',
        status: 'pending',
      });
      prisma.payment.update.mockResolvedValue({ id: PAYMENT_ID, amount: 100000 });

      const result = await service.initiatePayment(USER_ID, {
        applicationId: APPLICATION_ID,
        paymentPlan: 'annual',
      });

      expect(result.amount).toBe(100000);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: PAYMENT_ID },
        data: { amount: 100000, paymentPlan: 'annual' },
      });
    });

    it('charges the accepted quote amount from the quote record, not formData', async () => {
      prisma.application.findUnique.mockResolvedValue(
        buildApplication({
          status: 'pending_payment',
          formData: { fromQuoteId: 'quote-1', calculatedPremium: 1, quotedPremium: 1 },
          product: {
            name: 'Marine Cargo',
            pricingType: 'quote_based',
            premiumAmount: null,
            rate: null,
            assetFields: null,
          },
        }),
      );
      prisma.quote.findFirst.mockResolvedValue({ finalAmount: '250000' });

      const result = await service.initiatePayment(USER_ID, {
        applicationId: APPLICATION_ID,
        paymentPlan: 'monthly',
      });

      expect(result.amount).toBe(20834);
      expect(prisma.quote.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'quote-1', customerId: USER_ID, status: 'accepted' }),
        }),
      );
    });

    it('refuses to start a payment when no server-side premium can be resolved', async () => {
      prisma.application.findUnique.mockResolvedValue(
        buildApplication({
          formData: { calculatedPremium: 1, quotedPremium: 1 },
          product: {
            name: 'Marine Cargo',
            pricingType: 'quote_based',
            premiumAmount: null,
            rate: null,
            assetFields: null,
          },
        }),
      );

      await expect(
        service.initiatePayment(USER_ID, { applicationId: APPLICATION_ID }),
      ).rejects.toThrow(BadRequestException);
      expect(monnifyService.initializeTransaction).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook amount check against the server premium', () => {
    const reference = `${PAYMENT_ID}-1700000000000`;

    function mockVerification(amount: number) {
      monnifyService.verifyTransaction.mockResolvedValue({
        status: 'PAID',
        amount,
        reference,
        gatewayResponse: { verified: true },
      });
    }

    it('rejects a payment whose stored and verified amounts match each other but not the server premium', async () => {
      prisma.application.findUnique.mockResolvedValue(motorApplication({ calculatedPremium: 1 }));
      mockPendingPayment({ amount: 1 });
      mockVerification(1);

      await service.handleWebhook(
        buildWebhookPayload('SUCCESSFUL_TRANSACTION', reference),
        'valid-signature',
      );

      expect(policiesService.generatePolicy).not.toHaveBeenCalled();
    });

    it('issues the policy when the verified amount matches the server premium', async () => {
      prisma.application.findUnique.mockResolvedValue(motorApplication({ calculatedPremium: 1 }));
      mockPendingPayment({ amount: 100000 });
      mockVerification(100000);

      await service.handleWebhook(
        buildWebhookPayload('SUCCESSFUL_TRANSACTION', reference),
        'valid-signature',
      );

      expect(policiesService.generatePolicy).toHaveBeenCalledWith(
        APPLICATION_ID,
        PAYMENT_ID,
        { verified: true },
      );
    });

    it('compares a monthly payment against the monthly instalment of the server premium', async () => {
      prisma.application.findUnique.mockResolvedValue(motorApplication());
      mockPendingPayment({ amount: 8334, paymentPlan: 'monthly' });
      mockVerification(8334);

      await service.handleWebhook(
        buildWebhookPayload('SUCCESSFUL_TRANSACTION', reference),
        'valid-signature',
      );

      expect(policiesService.generatePolicy).toHaveBeenCalled();
    });

    it('refuses to issue the policy when the application cannot be found', async () => {
      prisma.application.findUnique.mockResolvedValue(null);
      mockPendingPayment();
      mockVerification(5000);

      await service.handleWebhook(
        buildWebhookPayload('SUCCESSFUL_TRANSACTION', reference),
        'valid-signature',
      );

      expect(policiesService.generatePolicy).not.toHaveBeenCalled();
    });

    it('refuses to issue the policy when no server premium can be resolved', async () => {
      prisma.application.findUnique.mockResolvedValue(
        buildApplication({
          formData: { quotedPremium: 5000 },
          product: {
            name: 'Marine Cargo',
            pricingType: 'quote_based',
            premiumAmount: null,
            rate: null,
            assetFields: null,
          },
        }),
      );
      mockPendingPayment();
      mockVerification(5000);

      await service.handleWebhook(
        buildWebhookPayload('SUCCESSFUL_TRANSACTION', reference),
        'valid-signature',
      );

      expect(policiesService.generatePolicy).not.toHaveBeenCalled();
    });
  });
});
