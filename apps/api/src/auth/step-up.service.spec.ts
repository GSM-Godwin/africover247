import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, HttpStatus, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  StepUpService,
  STEP_UP_CODE_TTL_MS,
  STEP_UP_MAX_ATTEMPTS,
  STEP_UP_MAX_SENDS_PER_WINDOW,
  STEP_UP_RESEND_COOLDOWN_MS,
  STEP_UP_SEND_WINDOW_MS,
} from './step-up.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { StepUpTokenService } from './step-up-token.service';
import { PremiumService } from '../premium/premium.service';

const USER_ID = 'user-1';

interface StoredCode {
  userId: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  sendCount: number;
  windowStartedAt: Date;
  lastSentAt: Date;
}

function buildUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: USER_ID,
    email: 'ada@example.com',
    firstName: 'Ada',
    emailVerified: true,
    googleId: 'google-sub-1',
    appleId: null,
    suspended: false,
    deletedAt: null,
    tokenVersion: 0,
    ...overrides,
  };
}

function createFakePrisma() {
  const codes = new Map<string, StoredCode>();
  const user = { findUnique: jest.fn().mockResolvedValue(buildUser()) };
  const stepUpCode = {
    findUnique: jest.fn(({ where }) => {
      const stored = codes.get(where.userId);
      return Promise.resolve(stored ? { ...stored } : null);
    }),
    upsert: jest.fn(({ where, create, update }) => {
      const existing = codes.get(where.userId);
      const next = existing ? { ...existing, ...update } : { ...create };
      codes.set(where.userId, next);
      return Promise.resolve(next);
    }),
    updateMany: jest.fn(({ where, data }) => {
      const existing = codes.get(where.userId);
      if (!existing || existing.attempts >= where.attempts.lt) {
        return Promise.resolve({ count: 0 });
      }
      existing.attempts += data.attempts.increment;
      return Promise.resolve({ count: 1 });
    }),
    delete: jest.fn(({ where }) => {
      codes.delete(where.userId);
      return Promise.resolve({});
    }),
  };
  const application = { findFirst: jest.fn().mockResolvedValue(null) };
  return { codes, prisma: { user, stepUpCode, application } };
}

describe('StepUpService', () => {
  let service: StepUpService;
  let fake: ReturnType<typeof createFakePrisma>;
  let emailService: { sendVerificationCodeEmail: jest.Mock };
  let premiumService: { resolveAnnualPremium: jest.Mock; amountForPlan: jest.Mock };
  let stepUpTokenService: { issue: jest.Mock };
  let logSpy: jest.SpyInstance;
  let now: number;

  beforeEach(async () => {
    now = Date.UTC(2026, 10, 7, 9, 0, 0);
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    fake = createFakePrisma();
    emailService = { sendVerificationCodeEmail: jest.fn().mockResolvedValue(undefined) };
    premiumService = {
      resolveAnnualPremium: jest.fn().mockResolvedValue(120000),
      amountForPlan: jest.fn((annual: number, plan: string) =>
        plan === 'monthly' ? Math.ceil(annual / 12) : annual,
      ),
    };
    stepUpTokenService = { issue: jest.fn().mockReturnValue('step-up-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StepUpService,
        { provide: PrismaService, useValue: fake.prisma },
        { provide: EmailService, useValue: emailService },
        { provide: StepUpTokenService, useValue: stepUpTokenService },
        { provide: PremiumService, useValue: premiumService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('unit-test-jwt-secret') },
        },
      ],
    }).compile();

    service = module.get(StepUpService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function lastEmailedCode(): string {
    const calls = emailService.sendVerificationCodeEmail.mock.calls;
    return calls[calls.length - 1][1].code;
  }

  function advance(ms: number) {
    now += ms;
  }

  async function expectStatus(promise: Promise<unknown>, status: number, message?: RegExp) {
    try {
      await promise;
      throw new Error('expected the call to fail');
    } catch (err) {
      const httpError = err as { getStatus?: () => number; message: string };
      expect(httpError.getStatus?.()).toBe(status);
      if (message) expect(httpError.message).toMatch(message);
    }
  }

  describe('sendEmailCode', () => {
    it('emails a 6-digit code to the account email and stores only a hash', async () => {
      const result = await service.sendEmailCode(USER_ID);

      const code = lastEmailedCode();
      expect(code).toMatch(/^\d{6}$/);
      expect(emailService.sendVerificationCodeEmail).toHaveBeenCalledWith(
        'ada@example.com',
        expect.objectContaining({
          code,
          firstName: 'Ada',
          purpose: 'payment_step_up',
          expiresInMinutes: 10,
          payment: null,
          device: null,
        }),
      );
      const stored = fake.codes.get(USER_ID)!;
      expect(stored.codeHash).toMatch(/^[0-9a-f]{64}$/);
      expect(stored.codeHash).not.toContain(code);
      expect(stored.expiresAt.getTime()).toBe(now + STEP_UP_CODE_TTL_MS);
      expect(result).toEqual({
        message: 'We sent a code to your email.',
        maskedEmail: 'a**@example.com',
        expiresInSeconds: STEP_UP_CODE_TTL_MS / 1000,
        resendAvailableInSeconds: STEP_UP_RESEND_COOLDOWN_MS / 1000,
      });
    });

    it('never logs the code or the email address', async () => {
      await service.sendEmailCode(USER_ID);

      const logged = logSpy.mock.calls.flat().join(' ');
      expect(logged).not.toContain(lastEmailedCode());
      expect(logged).not.toContain('ada@example.com');
    });

    it('refuses a resend inside the cooldown', async () => {
      await service.sendEmailCode(USER_ID);
      advance(STEP_UP_RESEND_COOLDOWN_MS - 5_000);

      await expectStatus(service.sendEmailCode(USER_ID), HttpStatus.TOO_MANY_REQUESTS, /wait 5 seconds/);
      expect(emailService.sendVerificationCodeEmail).toHaveBeenCalledTimes(1);
    });

    it('replaces the previous code on resend so only one code is active', async () => {
      await service.sendEmailCode(USER_ID);
      const firstCode = lastEmailedCode();
      advance(STEP_UP_RESEND_COOLDOWN_MS);
      await service.sendEmailCode(USER_ID);
      const secondCode = lastEmailedCode();

      if (firstCode !== secondCode) {
        await expect(service.verifyEmailCode(USER_ID, firstCode)).rejects.toThrow(/Incorrect code/);
      }
      await expect(service.verifyEmailCode(USER_ID, secondCode)).resolves.toMatchObject({ verified: true });
    });

    it('limits the number of codes per user within the send window', async () => {
      for (let i = 0; i < STEP_UP_MAX_SENDS_PER_WINDOW; i += 1) {
        await service.sendEmailCode(USER_ID);
        advance(STEP_UP_RESEND_COOLDOWN_MS);
      }

      await expectStatus(
        service.sendEmailCode(USER_ID),
        HttpStatus.TOO_MANY_REQUESTS,
        /Too many codes requested/,
      );
      expect(emailService.sendVerificationCodeEmail).toHaveBeenCalledTimes(STEP_UP_MAX_SENDS_PER_WINDOW);
    });

    it('allows sending again once the send window has passed', async () => {
      for (let i = 0; i < STEP_UP_MAX_SENDS_PER_WINDOW; i += 1) {
        await service.sendEmailCode(USER_ID);
        advance(STEP_UP_RESEND_COOLDOWN_MS);
      }
      advance(STEP_UP_SEND_WINDOW_MS);

      await expect(service.sendEmailCode(USER_ID)).resolves.toMatchObject({
        message: 'We sent a code to your email.',
      });
      expect(fake.codes.get(USER_ID)!.sendCount).toBe(1);
    });

    it.each([
      ['a deleted user', { deletedAt: new Date() }, UnauthorizedException, /deleted/],
      ['a suspended user', { suspended: true }, UnauthorizedException, /suspended/],
      ['a password-only user', { googleId: null, appleId: null }, BadRequestException, /use your password/],
      ['an unverified email', { emailVerified: false }, BadRequestException, /not verified/],
    ])('refuses %s', async (_label, overrides, errorType, message) => {
      fake.prisma.user.findUnique.mockResolvedValue(buildUser(overrides));

      const attempt = service.sendEmailCode(USER_ID);

      await expect(attempt).rejects.toThrow(errorType);
      await expect(attempt).rejects.toThrow(message);
      expect(emailService.sendVerificationCodeEmail).not.toHaveBeenCalled();
    });

    it('describes the payment, plan amount and device in the email', async () => {
      fake.prisma.application.findFirst.mockResolvedValue({
        id: 'application-1',
        userId: USER_ID,
        product: { name: 'Motor Comprehensive Insurance' },
      });

      await service.sendEmailCode(USER_ID, {
        applicationId: 'application-1',
        paymentPlan: 'monthly',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
      });

      expect(fake.prisma.application.findFirst).toHaveBeenCalledWith({
        where: { id: 'application-1', userId: USER_ID },
        include: { product: true },
      });
      const model = emailService.sendVerificationCodeEmail.mock.calls[0][1];
      expect(model.payment).toEqual({ productName: 'Motor Comprehensive Insurance', amount: 10000 });
      expect(model.device).toBe('Chrome on Windows');
      expect(model.requestedAt).toEqual(new Date(now));
    });

    it("leaves the payment out for an application that isn't the user's", async () => {
      await service.sendEmailCode(USER_ID, { applicationId: 'someone-elses-application' });

      expect(emailService.sendVerificationCodeEmail.mock.calls[0][1].payment).toBeNull();
    });

    it('still sends the code when the premium cannot be resolved', async () => {
      fake.prisma.application.findFirst.mockResolvedValue({ product: { name: 'Marine' } });
      premiumService.resolveAnnualPremium.mockRejectedValue(new Error('db'));

      await service.sendEmailCode(USER_ID, { applicationId: 'application-1' });

      expect(emailService.sendVerificationCodeEmail).toHaveBeenCalledTimes(1);
      expect(emailService.sendVerificationCodeEmail.mock.calls[0][1].payment).toBeNull();
    });

    it('works for Apple accounts', async () => {
      fake.prisma.user.findUnique.mockResolvedValue(
        buildUser({ googleId: null, appleId: 'apple-sub-1', email: 'x1y2@privaterelay.appleid.com' }),
      );

      await expect(service.sendEmailCode(USER_ID)).resolves.toMatchObject({
        maskedEmail: 'x***@privaterelay.appleid.com',
      });
    });
  });

  describe('verifyEmailCode', () => {
    it('returns the same proof as the password check for the correct code and consumes it', async () => {
      fake.prisma.user.findUnique.mockResolvedValue(buildUser({ tokenVersion: 4 }));
      await service.sendEmailCode(USER_ID);
      const code = lastEmailedCode();

      await expect(service.verifyEmailCode(USER_ID, code)).resolves.toEqual({
        verified: true,
        stepUpToken: 'step-up-token',
      });
      expect(stepUpTokenService.issue).toHaveBeenCalledWith(
        expect.objectContaining({ id: USER_ID, tokenVersion: 4 }),
      );
      expect(fake.codes.has(USER_ID)).toBe(false);
      await expect(service.verifyEmailCode(USER_ID, code)).rejects.toThrow(/No active code/);
    });

    it('rejects a wrong code and reports the attempts left', async () => {
      await service.sendEmailCode(USER_ID);
      const wrongCode = lastEmailedCode() === '000000' ? '111111' : '000000';

      await expectStatus(
        service.verifyEmailCode(USER_ID, wrongCode),
        HttpStatus.BAD_REQUEST,
        new RegExp(`${STEP_UP_MAX_ATTEMPTS - 1} attempts left`),
      );
    });

    it('rejects an expired code even when it is correct', async () => {
      await service.sendEmailCode(USER_ID);
      const code = lastEmailedCode();
      advance(STEP_UP_CODE_TTL_MS);

      await expectStatus(service.verifyEmailCode(USER_ID, code), HttpStatus.BAD_REQUEST, /expired/);
    });

    it('locks the code after the maximum number of attempts, even for the right code', async () => {
      await service.sendEmailCode(USER_ID);
      const code = lastEmailedCode();
      const wrongCode = code === '000000' ? '111111' : '000000';

      for (let i = 0; i < STEP_UP_MAX_ATTEMPTS - 1; i += 1) {
        await expect(service.verifyEmailCode(USER_ID, wrongCode)).rejects.toThrow(/attempts? left/);
      }
      await expect(service.verifyEmailCode(USER_ID, wrongCode)).rejects.toThrow(
        /Please request a new code/,
      );
      await expectStatus(
        service.verifyEmailCode(USER_ID, code),
        HttpStatus.TOO_MANY_REQUESTS,
        /Too many incorrect attempts/,
      );
    });

    it('rejects when no code was requested', async () => {
      await expectStatus(service.verifyEmailCode(USER_ID, '123456'), HttpStatus.BAD_REQUEST, /No active code/);
    });

    it.each([
      ['a deleted user', { deletedAt: new Date() }, /deleted/],
      ['a suspended user', { suspended: true }, /suspended/],
    ])('refuses %s even with the correct code', async (_label, overrides, message) => {
      await service.sendEmailCode(USER_ID);
      const code = lastEmailedCode();
      fake.prisma.user.findUnique.mockResolvedValue(buildUser(overrides));

      await expect(service.verifyEmailCode(USER_ID, code)).rejects.toThrow(UnauthorizedException);
      await expect(service.verifyEmailCode(USER_ID, code)).rejects.toThrow(message);
      expect(fake.codes.has(USER_ID)).toBe(true);
    });

    it("does not accept a code issued to another user", async () => {
      await service.sendEmailCode(USER_ID);
      const code = lastEmailedCode();
      const stored = fake.codes.get(USER_ID)!;
      fake.codes.set('user-2', { ...stored, userId: 'user-2' });

      await expect(service.verifyEmailCode('user-2', code)).rejects.toThrow(/Incorrect code/);
    });
  });
});
