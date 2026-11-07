jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));
jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => ({})),
  jwtVerify: jest.fn(),
  importPKCS8: jest.fn(),
  SignJWT: jest.fn(),
}));

import { ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  PAYMENT_STEP_UP_PURPOSE,
  STEP_UP_MESSAGES,
  STEP_UP_TOKEN_TTL_SECONDS,
  StepUpTokenService,
} from './step-up-token.service';
import { PaymentStepUpGuard } from './guards/payment-step-up.guard';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsController } from '../payments/payments.controller';

const USER_ID = 'user-1';
const ACCESS_SECRET = 'unit-test-access-secret';

function buildService(env: Record<string, string | undefined> = {}) {
  const jwtService = new JwtService({ secret: ACCESS_SECRET });
  const configService = {
    get: jest.fn((name: string) => env[name]),
    getOrThrow: jest.fn((name: string) => {
      if (name === 'JWT_SECRET') return ACCESS_SECRET;
      throw new Error(`missing ${name}`);
    }),
  } as unknown as ConfigService;
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue({ tokenVersion: 3 }) },
  };
  const service = new StepUpTokenService(
    jwtService,
    configService,
    prisma as unknown as PrismaService,
  );
  return { service, jwtService, prisma };
}

async function expectForbidden(promise: Promise<unknown>, message: string) {
  await expect(promise).rejects.toThrow(ForbiddenException);
  await expect(promise).rejects.toThrow(message);
}

describe('StepUpTokenService', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('issues a token bound to the user, tokenVersion and payment purpose that expires in 10 minutes', async () => {
    const { service, jwtService } = buildService();

    const token = service.issue({ id: USER_ID, tokenVersion: 3 });

    const decoded = jwtService.decode(token);
    expect(decoded).toMatchObject({
      sub: USER_ID,
      tokenVersion: 3,
      purpose: PAYMENT_STEP_UP_PURPOSE,
      aud: PAYMENT_STEP_UP_PURPOSE,
    });
    expect(decoded.exp - decoded.iat).toBe(STEP_UP_TOKEN_TTL_SECONDS);
    await expect(service.assertValid(token, USER_ID)).resolves.toBeUndefined();
  });

  it('refuses a missing token', async () => {
    const { service } = buildService();

    await expectForbidden(service.assertValid(undefined, USER_ID), STEP_UP_MESSAGES.missing);
  });

  it('refuses an expired token', async () => {
    const { service } = buildService();
    const token = service.issue({ id: USER_ID, tokenVersion: 3 });
    const issuedAt = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(issuedAt + (STEP_UP_TOKEN_TTL_SECONDS + 1) * 1000);

    await expectForbidden(service.assertValid(token, USER_ID), STEP_UP_MESSAGES.expired);
  });

  it("refuses another user's token", async () => {
    const { service } = buildService();
    const token = service.issue({ id: 'user-2', tokenVersion: 3 });

    await expectForbidden(service.assertValid(token, USER_ID), STEP_UP_MESSAGES.invalid);
  });

  it('refuses a token issued before logout or a password change bumped tokenVersion', async () => {
    const { service, prisma } = buildService();
    const token = service.issue({ id: USER_ID, tokenVersion: 3 });
    prisma.user.findUnique.mockResolvedValue({ tokenVersion: 4 });

    await expectForbidden(service.assertValid(token, USER_ID), STEP_UP_MESSAGES.invalid);
  });

  it('refuses a token for a user that no longer exists', async () => {
    const { service, prisma } = buildService();
    const token = service.issue({ id: USER_ID, tokenVersion: 3 });
    prisma.user.findUnique.mockResolvedValue(null);

    await expectForbidden(service.assertValid(token, USER_ID), STEP_UP_MESSAGES.invalid);
  });

  it('refuses a token signed for a different purpose', async () => {
    const { service, jwtService } = buildService();
    const secret = (service as unknown as { signingSecret: () => string }).signingSecret();
    const token = jwtService.sign(
      { sub: USER_ID, tokenVersion: 3, purpose: 'email-change' },
      { secret, audience: PAYMENT_STEP_UP_PURPOSE, expiresIn: 600 },
    );

    await expectForbidden(service.assertValid(token, USER_ID), STEP_UP_MESSAGES.invalid);
  });

  it('refuses a token with the wrong audience', async () => {
    const { service, jwtService } = buildService();
    const secret = (service as unknown as { signingSecret: () => string }).signingSecret();
    const token = jwtService.sign(
      { sub: USER_ID, tokenVersion: 3, purpose: PAYMENT_STEP_UP_PURPOSE },
      { secret, audience: 'something-else', expiresIn: 600 },
    );

    await expectForbidden(service.assertValid(token, USER_ID), STEP_UP_MESSAGES.invalid);
  });

  it('refuses a normal access token presented as a step-up token', async () => {
    const { service, jwtService } = buildService();
    const accessToken = jwtService.sign({ sub: USER_ID, tokenVersion: 3, role: 'customer' });

    await expectForbidden(service.assertValid(accessToken, USER_ID), STEP_UP_MESSAGES.invalid);
  });

  it('issues step-up tokens that cannot be used as access tokens', () => {
    const { service, jwtService } = buildService();
    const token = service.issue({ id: USER_ID, tokenVersion: 3 });

    expect(() => jwtService.verify(token, { secret: ACCESS_SECRET })).toThrow();
  });

  it('refuses a malformed token', async () => {
    const { service } = buildService();

    await expectForbidden(service.assertValid('not-a-jwt', USER_ID), STEP_UP_MESSAGES.invalid);
  });

  describe('enforcement flag', () => {
    it('is off by default and warns once at startup', () => {
      const { service } = buildService();

      service.onModuleInit();

      expect(service.isEnforced()).toBe(false);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('ENFORCE_PAYMENT_STEP_UP');
    });

    it('is on only for the exact value "true" and does not warn', () => {
      const { service } = buildService({ ENFORCE_PAYMENT_STEP_UP: 'true' });

      service.onModuleInit();

      expect(service.isEnforced()).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();
      expect(buildService({ ENFORCE_PAYMENT_STEP_UP: 'yes' }).service.isEnforced()).toBe(false);
    });
  });
});

describe('PaymentStepUpGuard', () => {
  function contextFor(headers: Record<string, string>, userId = USER_ID) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers, user: { id: userId } }),
      }),
    } as unknown as ExecutionContext;
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('protects POST /payments/initiate', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, PaymentsController.prototype.initiate);

    expect(guards).toContain(PaymentStepUpGuard);
  });

  it('lets the old flow through without a token when enforcement is off', async () => {
    const { service } = buildService();
    const guard = new PaymentStepUpGuard(service);

    await expect(guard.canActivate(contextFor({}))).resolves.toBe(true);
  });

  it('refuses a request without the header when enforcement is on', async () => {
    const { service } = buildService({ ENFORCE_PAYMENT_STEP_UP: 'true' });
    const guard = new PaymentStepUpGuard(service);

    await expectForbidden(guard.canActivate(contextFor({})), STEP_UP_MESSAGES.missing);
  });

  it('accepts a valid token from the X-Step-Up-Token header when enforcement is on', async () => {
    const { service } = buildService({ ENFORCE_PAYMENT_STEP_UP: 'true' });
    const guard = new PaymentStepUpGuard(service);
    const token = service.issue({ id: USER_ID, tokenVersion: 3 });

    await expect(guard.canActivate(contextFor({ 'x-step-up-token': token }))).resolves.toBe(true);
  });

  it("refuses another user's token when enforcement is on", async () => {
    const { service } = buildService({ ENFORCE_PAYMENT_STEP_UP: 'true' });
    const guard = new PaymentStepUpGuard(service);
    const token = service.issue({ id: 'user-2', tokenVersion: 3 });

    await expectForbidden(
      guard.canActivate(contextFor({ 'x-step-up-token': token })),
      STEP_UP_MESSAGES.invalid,
    );
  });
});
