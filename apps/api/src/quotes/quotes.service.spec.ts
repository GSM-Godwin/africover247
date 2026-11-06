import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';

const QUOTE_ID = 'quote-1';
const USER_ID = 'user-1';
const ADMIN_ID = 'admin-1';

function buildQuote(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: QUOTE_ID,
    customerId: USER_ID,
    productId: 'product-1',
    status: 'quote_sent',
    adminQuoteAmount: null,
    customerCounterAmount: null,
    finalAmount: null,
    negotiationHistory: [],
    roundsUsed: 0,
    expiresAt: null,
    customerDetails: { vehicleValue: '1000000' },
    customer: {
      id: USER_ID,
      firstName: 'Ada',
      lastName: 'Okafor',
      email: 'ada@example.com',
      phone: '+2348012345678',
      role: 'customer',
    },
    product: { id: 'product-1', name: 'Motor Comprehensive' },
    ...overrides,
  };
}

describe('QuotesService', () => {
  let service: QuotesService;
  let prisma: {
    quote: {
      findUnique: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
    user: { findMany: jest.Mock; findUnique: jest.Mock };
    notification: { create: jest.Mock; createMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    quote: { updateMany: jest.Mock };
    application: { create: jest.Mock };
    payment: { create: jest.Mock };
  };
  let adminService: { createAuditLog: jest.Mock };

  beforeEach(async () => {
    tx = {
      quote: { updateMany: jest.fn() },
      application: { create: jest.fn() },
      payment: { create: jest.fn() },
    };
    prisma = {
      quote: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      user: { findMany: jest.fn().mockResolvedValue([]), findUnique: jest.fn() },
      notification: { create: jest.fn(), createMany: jest.fn() },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(tx)),
    };
    adminService = { createAuditLog: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AdminService, useValue: adminService },
        {
          provide: EmailService,
          useValue: { sendEmail: jest.fn(), sendQuoteStatusEmail: jest.fn() },
        },
        { provide: SmsService, useValue: { sendNotificationSms: jest.fn() } },
      ],
    }).compile();

    service = module.get(QuotesService);
  });

  describe('acceptQuote', () => {
    it('creates exactly one application when accepted once', async () => {
      const quote = buildQuote({ adminQuoteAmount: 50000 });
      prisma.quote.findUnique.mockResolvedValue(quote);
      tx.quote.updateMany.mockResolvedValue({ count: 1 });
      tx.application.create.mockResolvedValue({ id: 'application-1' });
      prisma.user.findUnique.mockResolvedValue({
        email: 'ada@example.com',
        firstName: 'Ada',
      });

      const result = await service.acceptQuote(QUOTE_ID, USER_ID);

      expect(result.applicationId).toBe('application-1');
      expect(tx.application.create).toHaveBeenCalledTimes(1);
      expect(tx.payment.create).toHaveBeenCalledTimes(1);
    });

    it('rejects a second concurrent accept and creates no second application', async () => {
      const quote = buildQuote({ adminQuoteAmount: 50000 });
      prisma.quote.findUnique.mockResolvedValue(quote);
      prisma.user.findUnique.mockResolvedValue({
        email: 'ada@example.com',
        firstName: 'Ada',
      });

      tx.quote.updateMany.mockResolvedValueOnce({ count: 1 });
      tx.application.create.mockResolvedValueOnce({ id: 'application-1' });
      await service.acceptQuote(QUOTE_ID, USER_ID);

      tx.quote.updateMany.mockResolvedValueOnce({ count: 0 });
      await expect(service.acceptQuote(QUOTE_ID, USER_ID)).rejects.toThrow(
        ConflictException,
      );

      expect(tx.application.create).toHaveBeenCalledTimes(1);
    });

    it('uses the admin quote amount over the customer counter when both are present', async () => {
      const quote = buildQuote({
        adminQuoteAmount: 75000,
        customerCounterAmount: 60000,
      });
      prisma.quote.findUnique.mockResolvedValue(quote);
      prisma.user.findUnique.mockResolvedValue({
        email: 'ada@example.com',
        firstName: 'Ada',
      });
      tx.quote.updateMany.mockResolvedValue({ count: 1 });
      tx.application.create.mockResolvedValue({ id: 'application-1' });

      const result = await service.acceptQuote(QUOTE_ID, USER_ID);

      expect(result.amount).toBe(75000);
    });

    it('falls back to the customer counter amount when no admin amount is set', async () => {
      const quote = buildQuote({
        adminQuoteAmount: null,
        customerCounterAmount: 60000,
      });
      prisma.quote.findUnique.mockResolvedValue(quote);
      prisma.user.findUnique.mockResolvedValue({
        email: 'ada@example.com',
        firstName: 'Ada',
      });
      tx.quote.updateMany.mockResolvedValue({ count: 1 });
      tx.application.create.mockResolvedValue({ id: 'application-1' });

      const result = await service.acceptQuote(QUOTE_ID, USER_ID);

      expect(result.amount).toBe(60000);
    });

    it('rejects when neither an admin amount nor a counter amount exists', async () => {
      const quote = buildQuote({ adminQuoteAmount: null, customerCounterAmount: null });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(service.acceptQuote(QUOTE_ID, USER_ID)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects when the quote does not exist', async () => {
      prisma.quote.findUnique.mockResolvedValue(null);

      await expect(service.acceptQuote(QUOTE_ID, USER_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects when the quote belongs to a different customer', async () => {
      const quote = buildQuote({ customerId: 'someone-else', adminQuoteAmount: 50000 });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(service.acceptQuote(QUOTE_ID, USER_ID)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects when the quote is not in an acceptable state', async () => {
      const quote = buildQuote({ status: 'accepted', adminQuoteAmount: 50000 });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(service.acceptQuote(QUOTE_ID, USER_ID)).rejects.toThrow(
        'This quote cannot be accepted in its current state',
      );
    });

    it('marks an expired quote as expired and rejects instead of accepting it', async () => {
      const quote = buildQuote({
        adminQuoteAmount: 50000,
        expiresAt: new Date(Date.now() - 60_000),
      });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(service.acceptQuote(QUOTE_ID, USER_ID)).rejects.toThrow(
        'This quote has expired. Please request a new one.',
      );
      expect(prisma.quote.update).toHaveBeenCalledWith({
        where: { id: QUOTE_ID },
        data: { status: 'expired' },
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('customerCounterQuote', () => {
    it('records a counter-offer and increments the rounds used', async () => {
      const quote = buildQuote({ roundsUsed: 0 });
      prisma.quote.findUnique.mockResolvedValue(quote);
      prisma.quote.update.mockResolvedValue({ ...quote, status: 'countered_by_customer' });

      const result = await service.customerCounterQuote(QUOTE_ID, USER_ID, {
        counterAmount: 45000,
      } as any);

      expect(prisma.quote.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: QUOTE_ID },
          data: expect.objectContaining({
            status: 'countered_by_customer',
            customerCounterAmount: 45000,
            roundsUsed: { increment: 1 },
          }),
        }),
      );
      expect(result.status).toBe('countered_by_customer');
    });

    it('rejects once the maximum negotiation rounds are reached', async () => {
      const quote = buildQuote({ roundsUsed: 3 });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(
        service.customerCounterQuote(QUOTE_ID, USER_ID, { counterAmount: 45000 } as any),
      ).rejects.toThrow(/maximum negotiation rounds/i);
    });

    it('rejects when the quote is not in a counterable state', async () => {
      const quote = buildQuote({ status: 'accepted' });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(
        service.customerCounterQuote(QUOTE_ID, USER_ID, { counterAmount: 45000 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when the quote does not exist', async () => {
      prisma.quote.findUnique.mockResolvedValue(null);

      await expect(
        service.customerCounterQuote(QUOTE_ID, USER_ID, { counterAmount: 45000 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects when the quote belongs to a different customer', async () => {
      const quote = buildQuote({ customerId: 'someone-else' });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(
        service.customerCounterQuote(QUOTE_ID, USER_ID, { counterAmount: 45000 } as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('marks an expired quote as expired and rejects instead of countering it', async () => {
      const quote = buildQuote({ expiresAt: new Date(Date.now() - 60_000) });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(
        service.customerCounterQuote(QUOTE_ID, USER_ID, { counterAmount: 45000 } as any),
      ).rejects.toThrow('This quote has expired.');
      expect(prisma.quote.update).toHaveBeenCalledWith({
        where: { id: QUOTE_ID },
        data: { status: 'expired' },
      });
    });
  });

  describe('adminAcceptCounter', () => {
    it('accepts the customer counter and creates one application', async () => {
      const quote = buildQuote({
        status: 'countered_by_customer',
        customerCounterAmount: 42000,
      });
      prisma.quote.findUnique.mockResolvedValue(quote);
      prisma.user.findUnique.mockResolvedValue({
        email: 'ada@example.com',
        firstName: 'Ada',
      });
      tx.quote.updateMany.mockResolvedValue({ count: 1 });
      tx.application.create.mockResolvedValue({ id: 'application-2' });

      const result = await service.adminAcceptCounter(QUOTE_ID, ADMIN_ID);

      expect(result.amount).toBe(42000);
      expect(tx.application.create).toHaveBeenCalledTimes(1);
      expect(adminService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'QUOTE_COUNTER_ACCEPTED', actorId: ADMIN_ID }),
      );
    });

    it('rejects a second concurrent accept and creates no second application', async () => {
      const quote = buildQuote({
        status: 'countered_by_customer',
        customerCounterAmount: 42000,
      });
      prisma.quote.findUnique.mockResolvedValue(quote);
      prisma.user.findUnique.mockResolvedValue({
        email: 'ada@example.com',
        firstName: 'Ada',
      });

      tx.quote.updateMany.mockResolvedValueOnce({ count: 1 });
      tx.application.create.mockResolvedValueOnce({ id: 'application-2' });
      await service.adminAcceptCounter(QUOTE_ID, ADMIN_ID);

      tx.quote.updateMany.mockResolvedValueOnce({ count: 0 });
      await expect(service.adminAcceptCounter(QUOTE_ID, ADMIN_ID)).rejects.toThrow(
        ConflictException,
      );

      expect(tx.application.create).toHaveBeenCalledTimes(1);
    });

    it('rejects when there is no customer counter to accept', async () => {
      const quote = buildQuote({ status: 'quote_sent' });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(service.adminAcceptCounter(QUOTE_ID, ADMIN_ID)).rejects.toThrow(
        /no customer counter/i,
      );
    });

    it('rejects when the quote does not exist', async () => {
      prisma.quote.findUnique.mockResolvedValue(null);

      await expect(service.adminAcceptCounter(QUOTE_ID, ADMIN_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects when the countered status has no counter amount recorded', async () => {
      const quote = buildQuote({ status: 'countered_by_customer', customerCounterAmount: null });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(service.adminAcceptCounter(QUOTE_ID, ADMIN_ID)).rejects.toThrow(
        'No counter amount found',
      );
    });
  });

  describe('adminCounterQuote', () => {
    it('rejects once the maximum negotiation rounds are reached', async () => {
      const quote = buildQuote({ status: 'countered_by_customer', roundsUsed: 3 });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(
        service.adminCounterQuote(QUOTE_ID, ADMIN_ID, { counterAmount: 48000 } as any),
      ).rejects.toThrow(/maximum negotiation rounds/i);
    });

    it('rejects when there is no customer counter to respond to', async () => {
      const quote = buildQuote({ status: 'quote_sent' });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(
        service.adminCounterQuote(QUOTE_ID, ADMIN_ID, { counterAmount: 48000 } as any),
      ).rejects.toThrow(/no customer counter/i);
    });

    it('rejects when the quote does not exist', async () => {
      prisma.quote.findUnique.mockResolvedValue(null);

      await expect(
        service.adminCounterQuote(QUOTE_ID, ADMIN_ID, { counterAmount: 48000 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('records the admin counter-offer and extends the expiry', async () => {
      const quote = buildQuote({ status: 'countered_by_customer', roundsUsed: 1 });
      prisma.quote.findUnique.mockResolvedValue(quote);
      prisma.quote.update.mockResolvedValue({ ...quote, status: 'countered_by_admin' });
      prisma.user.findUnique.mockResolvedValue({
        email: 'ada@example.com',
        firstName: 'Ada',
        pushToken: null,
      });

      const result = await service.adminCounterQuote(QUOTE_ID, ADMIN_ID, {
        counterAmount: 48000,
        note: 'Best we can do',
      } as any);

      expect(prisma.quote.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: QUOTE_ID },
          data: expect.objectContaining({
            status: 'countered_by_admin',
            adminQuoteAmount: 48000,
            adminNote: 'Best we can do',
            roundsUsed: { increment: 1 },
          }),
        }),
      );
      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
      expect(adminService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'QUOTE_COUNTERED', actorId: ADMIN_ID }),
      );
      expect(result.status).toBe('countered_by_admin');
    });
  });

  describe('adminRespondToQuote', () => {
    it('rejects when the quote does not exist', async () => {
      prisma.quote.findUnique.mockResolvedValue(null);

      await expect(
        service.adminRespondToQuote(QUOTE_ID, { quoteAmount: 50000 } as any, ADMIN_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects when the quote is not awaiting a response', async () => {
      const quote = buildQuote({ status: 'accepted' });
      prisma.quote.findUnique.mockResolvedValue(quote);

      await expect(
        service.adminRespondToQuote(QUOTE_ID, { quoteAmount: 50000 } as any, ADMIN_ID),
      ).rejects.toThrow('This quote cannot be responded to in its current state');
    });

    it('sends a quote to the customer and records the audit log', async () => {
      const quote = buildQuote({ status: 'pending_review' });
      prisma.quote.findUnique.mockResolvedValue(quote);
      prisma.quote.update.mockResolvedValue({ ...quote, status: 'quote_sent' });
      prisma.user.findUnique.mockResolvedValue({
        email: 'ada@example.com',
        firstName: 'Ada',
        pushToken: null,
      });

      const result = await service.adminRespondToQuote(
        QUOTE_ID,
        { quoteAmount: 50000, note: 'Standard rate' } as any,
        ADMIN_ID,
      );

      expect(prisma.quote.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: QUOTE_ID },
          data: expect.objectContaining({
            status: 'quote_sent',
            adminQuoteAmount: 50000,
            adminNote: 'Standard rate',
          }),
        }),
      );
      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
      expect(adminService.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'QUOTE_RESPONDED', actorId: ADMIN_ID }),
      );
      expect(result.status).toBe('quote_sent');
    });

    it('accepts a response to a countered_by_customer quote too', async () => {
      const quote = buildQuote({ status: 'countered_by_customer' });
      prisma.quote.findUnique.mockResolvedValue(quote);
      prisma.quote.update.mockResolvedValue({ ...quote, status: 'quote_sent' });
      prisma.user.findUnique.mockResolvedValue({
        email: 'ada@example.com',
        firstName: 'Ada',
        pushToken: null,
      });

      await expect(
        service.adminRespondToQuote(QUOTE_ID, { quoteAmount: 50000 } as any, ADMIN_ID),
      ).resolves.toMatchObject({ status: 'quote_sent' });
    });
  });
});
