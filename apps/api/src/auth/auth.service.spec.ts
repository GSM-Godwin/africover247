jest.mock('bcrypt');

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => ({})),
  jwtVerify: jest.fn(),
}));

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { jwtVerify } from 'jose';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';

const FAKE_PASSWORD_HASH = '$2b$12$unittestfixturehasheddoesnotmatchanyrealpassword';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    passwordReset: { findFirst: jest.Mock; update: jest.Mock };
  };
  let jwtService: { sign: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
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
});
