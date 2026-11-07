jest.mock('bcrypt');

jest.mock('jose', () => {
  class SignJWT {
    setProtectedHeader() { return this; }
    setIssuer() { return this; }
    setSubject() { return this; }
    setAudience() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    sign() { return Promise.resolve('client-secret-jwt'); }
  }
  return {
    createRemoteJWKSet: jest.fn(() => ({})),
    jwtVerify: jest.fn(),
    importPKCS8: jest.fn().mockResolvedValue({}),
    SignJWT,
  };
});

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { jwtVerify } from 'jose';
import { AuthService } from './auth.service';
import { AppleTokenService } from './apple-token.service';
import { decryptField } from '../common/crypto/field-encryption';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';

const FAKE_PASSWORD_HASH = '$2b$12$unittestfixturehasheddoesnotmatchanyrealpassword';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock; create: jest.Mock };
    passwordReset: { findFirst: jest.Mock; update: jest.Mock };
  };
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
      passwordReset: { findFirst: jest.fn(), update: jest.fn() },
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt') };
    configService = { get: jest.fn().mockReturnValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        {
          provide: EmailService,
          useValue: { sendOtpEmail: jest.fn(), sendEmail: jest.fn() },
        },
        { provide: SmsService, useValue: { sendOtpSms: jest.fn() } },
        AppleTokenService,
      ],
    }).compile();

    service = module.get(AuthService);
  });

  function buildUser(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'user-1',
      email: 'customer@example.com',
      firstName: 'Ada',
      lastName: 'Okafor',
      role: 'customer',
      passwordHash: FAKE_PASSWORD_HASH,
      emailVerified: true,
      suspended: false,
      suspendedReason: null,
      deletedAt: null,
      tokenVersion: 0,
      googleId: null,
      appleId: null,
      ...overrides,
    };
  }

  describe('login', () => {
    it('returns an access token and the sanitised user on success', async () => {
      const user = buildUser();
      prisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: user.email,
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('signed-jwt');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: user.id, tokenVersion: user.tokenVersion }),
        expect.any(Object),
      );
    });

    it('rejects a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'customer@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a suspended account', async () => {
      prisma.user.findUnique.mockResolvedValue(
        buildUser({ suspended: true, suspendedReason: 'Fraud review' }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'customer@example.com', password: 'correct' }),
      ).rejects.toThrow(/suspended/i);
    });

    it('rejects a deleted account without comparing the password', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser({ deletedAt: new Date() }));
      const compareSpy = bcrypt.compare as jest.Mock;

      await expect(
        service.login({ email: 'customer@example.com', password: 'anything' }),
      ).rejects.toThrow(UnauthorizedException);
      expect(compareSpy).not.toHaveBeenCalled();
    });

    it('rejects an unverified email before checking suspension', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser({ emailVerified: false }));
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'customer@example.com', password: 'correct' }),
      ).rejects.toThrow(/verify your email/i);
    });
  });

  describe('logout', () => {
    it('increments the tokenVersion so existing sessions are invalidated', async () => {
      prisma.user.update.mockResolvedValue({});

      const result = await service.logout('user-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tokenVersion: { increment: 1 } },
      });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('resetPassword', () => {
    const resetRecord = {
      id: 'reset-1',
      userId: 'user-1',
      token: '123456',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    };

    it('updates the password hash and increments tokenVersion on success', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.passwordReset.findFirst.mockResolvedValue(resetRecord);
      prisma.passwordReset.update.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      const result = await service.resetPassword({
        email: 'customer@example.com',
        otp: '123456',
        newPassword: 'NewStrongPass1',
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
      expect(prisma.user.update.mock.calls[0][0].data).toHaveProperty('passwordHash');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { tokenVersion: { increment: 1 } },
      });
      expect(prisma.passwordReset.update).toHaveBeenCalledWith({
        where: { id: 'reset-1' },
        data: { usedAt: expect.any(Date) },
      });
      expect(result).toEqual({ message: 'Password reset successful. You can now log in.' });
    });

    it('rejects an incorrect reset code', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.passwordReset.findFirst.mockResolvedValue(resetRecord);

      await expect(
        service.resetPassword({
          email: 'customer@example.com',
          otp: 'wrong-code',
          newPassword: 'NewStrongPass1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an expired reset code', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      prisma.passwordReset.findFirst.mockResolvedValue({
        ...resetRecord,
        expiresAt: new Date(Date.now() - 60_000),
      });

      await expect(
        service.resetPassword({
          email: 'customer@example.com',
          otp: '123456',
          newPassword: 'NewStrongPass1',
        }),
      ).rejects.toThrow(/expired/i);
    });
  });

  describe('googleAuth failure paths', () => {
    it('refuses to verify when no Google client IDs are configured', async () => {
      await expect(
        service.googleAuth('some-id-token', 'Ada', 'Okafor'),
      ).rejects.toThrow(/not configured/i);
    });

    it('rejects a Google ID token that fails verification', async () => {
      configService.get.mockReturnValue('configured-client-id');
      const googleClient = (service as unknown as {
        googleClient: { verifyIdToken: jest.Mock };
      }).googleClient;
      googleClient.verifyIdToken.mockRejectedValue(new Error('bad token'));

      await expect(
        service.googleAuth('bad-id-token', 'Ada', 'Okafor'),
      ).rejects.toThrow(/Invalid Google sign-in token/i);
    });

    it('rejects a verified Google token whose email is not verified', async () => {
      configService.get.mockReturnValue('configured-client-id');
      const googleClient = (service as unknown as {
        googleClient: { verifyIdToken: jest.Mock };
      }).googleClient;
      googleClient.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-sub-1',
          email: 'ada@example.com',
          email_verified: false,
        }),
      });

      await expect(
        service.googleAuth('id-token', 'Ada', 'Okafor'),
      ).rejects.toThrow(/Invalid Google sign-in token/i);
    });
  });

  describe('appleAuth failure paths', () => {
    it('rejects an Apple identity token that fails JWKS verification', async () => {
      (jwtVerify as jest.Mock).mockRejectedValue(new Error('signature invalid'));

      await expect(
        service.appleAuth('bad-identity-token', 'Ada', 'Okafor'),
      ).rejects.toThrow(/Invalid Apple sign-in token/i);
    });

    it('rejects a verified Apple token with no subject claim', async () => {
      (jwtVerify as jest.Mock).mockResolvedValue({ payload: {} });

      await expect(
        service.appleAuth('identity-token', 'Ada', 'Okafor'),
      ).rejects.toThrow(/Invalid Apple sign-in token/i);
    });
  });

  describe('appleAuth refresh token storage', () => {
    const appleEnv: Record<string, string> = {
      APPLE_TEAM_ID: 'TEAMFIXTURE',
      APPLE_KEY_ID: 'KEYFIXTURE',
      APPLE_PRIVATE_KEY: 'unit-test-placeholder',
    };
    const originalKey = process.env.FIELD_ENCRYPTION_KEY;
    let fetchMock: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      process.env.FIELD_ENCRYPTION_KEY = randomBytes(32).toString('base64');
      configService.get.mockImplementation((name: string) => appleEnv[name]);
      fetchMock = jest.spyOn(global, 'fetch');
      warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: { sub: 'apple-sub-1', email: 'customer@example.com', email_verified: true },
      });
      prisma.user.findUnique.mockResolvedValue(buildUser({ appleId: 'apple-sub-1' }));
      prisma.user.update.mockResolvedValue({});
    });

    afterEach(() => {
      fetchMock.mockRestore();
      warnSpy.mockRestore();
    });

    afterAll(() => {
      if (originalKey === undefined) delete process.env.FIELD_ENCRYPTION_KEY;
      else process.env.FIELD_ENCRYPTION_KEY = originalKey;
    });

    it('saves the encrypted refresh token after a successful sign-in', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ refresh_token: 'apple-refresh-fixture' }),
      });

      const result = await service.appleAuth('identity-token', '', '', 'auth-code-fixture');

      expect(result.accessToken).toBe('signed-jwt');
      expect(fetchMock.mock.calls[0][0]).toBe('https://appleid.apple.com/auth/token');
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      const { where, data } = prisma.user.update.mock.calls[0][0];
      expect(where).toEqual({ id: 'user-1' });
      expect(data.appleRefreshToken).not.toBe('apple-refresh-fixture');
      expect(decryptField(data.appleRefreshToken)).toBe('apple-refresh-fixture');
      expect(result.user).not.toHaveProperty('appleRefreshToken');
    });

    it('still signs the user in when the code exchange fails', async () => {
      fetchMock.mockRejectedValue(new Error('network down'));

      const result = await service.appleAuth('identity-token', '', '', 'auth-code-fixture');

      expect(result.accessToken).toBe('signed-jwt');
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(warnSpy.mock.calls.flat().join(' ')).not.toContain('auth-code-fixture');
    });

    it('still signs the user in when Apple rejects the code', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve({}) });

      const result = await service.appleAuth('identity-token', '', '', 'auth-code-fixture');

      expect(result.accessToken).toBe('signed-jwt');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('still signs the user in when saving the token fails', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ refresh_token: 'apple-refresh-fixture' }),
      });
      prisma.user.update.mockRejectedValue(new Error('db unavailable'));

      const result = await service.appleAuth('identity-token', '', '', 'auth-code-fixture');

      expect(result.accessToken).toBe('signed-jwt');
    });

    it('does not call Apple when no authorization code is sent', async () => {
      await service.appleAuth('identity-token', '', '');

      expect(fetchMock).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('skips the exchange when the Apple signing env vars are missing', async () => {
      configService.get.mockReturnValue(undefined);

      const result = await service.appleAuth('identity-token', '', '', 'auth-code-fixture');

      expect(result.accessToken).toBe('signed-jwt');
      expect(fetchMock).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('skips the exchange when FIELD_ENCRYPTION_KEY is missing', async () => {
      delete process.env.FIELD_ENCRYPTION_KEY;

      const result = await service.appleAuth('identity-token', '', '', 'auth-code-fixture');

      expect(result.accessToken).toBe('signed-jwt');
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('appleAuth account resolution', () => {
    const relayEmail = 'abc123xyz@privaterelay.appleid.com';

    function mockApplePayload(claims: Record<string, unknown>) {
      (jwtVerify as jest.Mock).mockResolvedValue({
        payload: { sub: 'apple-sub-1', ...claims },
      });
    }

    function mockUserLookups(byAppleId: unknown, byEmail: unknown) {
      prisma.user.findUnique.mockImplementation(({ where }) =>
        Promise.resolve(where.appleId ? byAppleId : byEmail),
      );
    }

    it('logs in an existing user found by appleId without touching email or name', async () => {
      const user = buildUser({ appleId: 'apple-sub-1' });
      mockApplePayload({ email: 'other@example.com', email_verified: true });
      mockUserLookups(user, null);

      const result = await service.appleAuth('identity-token', 'New', 'Name');

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { appleId: 'apple-sub-1' },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(result.accessToken).toBe('signed-jwt');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('links an existing account by email when Apple marks the email verified', async () => {
      const existing = buildUser({ email: relayEmail });
      mockApplePayload({ email: relayEmail, email_verified: 'true' });
      mockUserLookups(null, existing);
      prisma.user.update.mockResolvedValue({ ...existing, appleId: 'apple-sub-1' });

      const result = await service.appleAuth('identity-token', 'Ada', 'Okafor');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: existing.id },
        data: { appleId: 'apple-sub-1' },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(result.accessToken).toBe('signed-jwt');
    });

    it('does not link an existing account when the Apple email is unverified', async () => {
      mockApplePayload({ email: 'customer@example.com', email_verified: false });
      mockUserLookups(null, buildUser());

      await expect(
        service.appleAuth('identity-token', 'Ada', 'Okafor'),
      ).rejects.toThrow(/already exists/i);
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('creates a new user with the supplied name for a private relay email', async () => {
      mockApplePayload({ email: relayEmail, email_verified: true });
      mockUserLookups(null, null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(FAKE_PASSWORD_HASH);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve(buildUser({ ...data, id: 'user-2' })),
      );

      const result = await service.appleAuth('identity-token', 'Ada', 'Okafor');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: relayEmail,
          firstName: 'Ada',
          lastName: 'Okafor',
          emailVerified: true,
          appleId: 'apple-sub-1',
          role: 'customer',
        }),
      });
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('creates a new unverified user when the email is unverified and unused', async () => {
      mockApplePayload({ email: 'fresh@example.com', email_verified: false });
      mockUserLookups(null, null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(FAKE_PASSWORD_HASH);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve(buildUser({ ...data })),
      );

      await service.appleAuth('identity-token', '', '');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'fresh@example.com',
          firstName: 'Apple',
          lastName: 'User',
          emailVerified: false,
        }),
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('refuses a deleted user found by appleId', async () => {
      mockApplePayload({ email: relayEmail, email_verified: true });
      mockUserLookups(buildUser({ appleId: 'apple-sub-1', deletedAt: new Date() }), null);

      await expect(
        service.appleAuth('identity-token', 'Ada', 'Okafor'),
      ).rejects.toThrow(/deleted/i);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('refuses to link a deleted account found by verified email', async () => {
      mockApplePayload({ email: 'customer@example.com', email_verified: true });
      mockUserLookups(null, buildUser({ deletedAt: new Date() }));

      await expect(
        service.appleAuth('identity-token', 'Ada', 'Okafor'),
      ).rejects.toThrow(/deleted/i);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('refuses a suspended user found by appleId', async () => {
      mockApplePayload({});
      mockUserLookups(
        buildUser({ appleId: 'apple-sub-1', suspended: true, suspendedReason: 'Fraud review' }),
        null,
      );

      await expect(
        service.appleAuth('identity-token', 'Ada', 'Okafor'),
      ).rejects.toThrow(/suspended/i);
    });
  });
});
