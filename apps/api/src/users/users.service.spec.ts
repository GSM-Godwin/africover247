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

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';
import { AuthService } from '../auth/auth.service';
import { AppleTokenService } from '../auth/apple-token.service';
import { encryptField } from '../common/crypto/field-encryption';

const USER_ID = 'user-1';
const FAKE_PASSWORD_HASH = '$2b$12$unittestfixturehasheddoesnotmatchanyrealpassword';

function buildUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: USER_ID,
    firstName: 'Ada',
    lastName: 'Okafor',
    email: 'ada@example.com',
    phone: '+2348012345678',
    alternativePhone: null,
    passwordHash: FAKE_PASSWORD_HASH,
    googleId: null,
    appleId: null,
    appleRefreshToken: null,
    pushToken: 'push-token',
    pushPlatform: 'ios',
    kycData: { note: 'fixture only' },
    kycVerified: true,
    kycVerifiedAt: new Date(),
    kycVerificationType: 'bvn',
    deletedAt: null,
    ...overrides,
  };
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    policy: { findFirst: jest.Mock };
    claim: { findFirst: jest.Mock };
  };
  let adminService: { createAuditLog: jest.Mock };
  let authService: { incrementTokenVersion: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      policy: { findFirst: jest.fn().mockResolvedValue(null) },
      claim: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    adminService = { createAuditLog: jest.fn() };
    authService = { incrementTokenVersion: jest.fn() };
    configService = { get: jest.fn().mockReturnValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AdminService, useValue: adminService },
        { provide: AuthService, useValue: authService },
        { provide: ConfigService, useValue: configService },
        AppleTokenService,
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('changePassword', () => {
    it('updates the hash and increments tokenVersion on a correct current password', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');

      const result = await service.changePassword(USER_ID, {
        currentPassword: 'OldPass1',
        newPassword: 'NewPass1',
        confirmPassword: 'NewPass1',
      } as any);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { passwordHash: 'new-hash' },
      });
      expect(authService.incrementTokenVersion).toHaveBeenCalledWith(USER_ID);
      expect(result).toEqual({ message: 'Password changed successfully' });
    });

    it('rejects when the current password is incorrect', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(USER_ID, {
          currentPassword: 'WrongPass',
          newPassword: 'NewPass1',
          confirmPassword: 'NewPass1',
        } as any),
      ).rejects.toThrow(BadRequestException);
      expect(authService.incrementTokenVersion).not.toHaveBeenCalled();
    });

    it('rejects when the new password matches the confirmation but not each other', async () => {
      await expect(
        service.changePassword(USER_ID, {
          currentPassword: 'OldPass1',
          newPassword: 'NewPass1',
          confirmPassword: 'Mismatch1',
        } as any),
      ).rejects.toThrow(/do not match/i);
    });
  });

  describe('deleteAccount', () => {
    it('rejects an incorrect password', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.deleteAccount({ id: USER_ID }, { password: 'wrong-password' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('deletes when the password is correct', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({});

      const result = await service.deleteAccount(
        { id: USER_ID },
        { password: 'correct-password' },
      );

      expect(result).toEqual({ message: 'Your account has been deleted.' });
      expect(prisma.user.update).toHaveBeenCalledTimes(1);
    });

    it('allows a Google/Apple account with no password through a fresh login instead', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser({ googleId: 'google-sub-1' }));
      prisma.user.update.mockResolvedValue({});
      const fiveSecondsAgo = Math.floor(Date.now() / 1000) - 5;

      const result = await service.deleteAccount(
        { id: USER_ID, iat: fiveSecondsAgo },
        {},
      );

      expect(result).toEqual({ message: 'Your account has been deleted.' });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('rejects a passwordless request when the login is not fresh', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser({ googleId: 'google-sub-1' }));
      const sixMinutesAgo = Math.floor(Date.now() / 1000) - 6 * 60;

      await expect(
        service.deleteAccount({ id: USER_ID, iat: sixMinutesAgo }, {}),
      ).rejects.toThrow(UnauthorizedException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects a passwordless request with no iat at all', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser({ googleId: 'google-sub-1' }));

      await expect(service.deleteAccount({ id: USER_ID }, {})).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('is blocked by an active policy', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.policy.findFirst.mockResolvedValue({ id: 'policy-1', status: 'active' });

      await expect(
        service.deleteAccount({ id: USER_ID }, { password: 'correct-password' }),
      ).rejects.toThrow(/active policy/i);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('is blocked by an open claim', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.claim.findFirst.mockResolvedValue({ id: 'claim-1', status: 'in_review' });

      await expect(
        service.deleteAccount({ id: USER_ID }, { password: 'correct-password' }),
      ).rejects.toThrow(/open claim/i);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('anonymises the personal and KYC fields and increments tokenVersion', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({});

      await service.deleteAccount({ id: USER_ID }, { password: 'correct-password' });

      const updateCall = prisma.user.update.mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: USER_ID });
      expect(updateCall.data).toMatchObject({
        firstName: 'Deleted',
        lastName: 'User',
        email: `deleted-${USER_ID}@deleted.invalid`,
        phone: null,
        alternativePhone: null,
        googleId: null,
        appleId: null,
        pushToken: null,
        pushPlatform: null,
        kycVerified: false,
        kycVerifiedAt: null,
        kycVerificationType: null,
        tokenVersion: { increment: 1 },
      });
      expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
    });

    it('writes an audit log entry with no personal data in the details', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({});

      await service.deleteAccount({ id: USER_ID }, { password: 'correct-password' });

      expect(adminService.createAuditLog).toHaveBeenCalledWith({
        actorId: USER_ID,
        action: 'USER_ACCOUNT_DELETED',
        entityType: 'User',
        entityId: USER_ID,
      });
    });

    describe('Apple token revocation', () => {
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
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
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

      function appleUser() {
        return buildUser({
          appleId: 'apple-sub-1',
          appleRefreshToken: encryptField('apple-refresh-fixture'),
        });
      }

      it('revokes the Apple refresh token and clears it during anonymisation', async () => {
        prisma.user.findUnique.mockResolvedValue(appleUser());
        fetchMock.mockResolvedValue({ ok: true, status: 200 });

        const result = await service.deleteAccount(
          { id: USER_ID },
          { password: 'correct-password' },
        );

        expect(result).toEqual({ message: 'Your account has been deleted.' });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('https://appleid.apple.com/auth/revoke');
        const form = new URLSearchParams(fetchMock.mock.calls[0][1].body);
        expect(form.get('token')).toBe('apple-refresh-fixture');
        expect(form.get('token_type_hint')).toBe('refresh_token');
        expect(prisma.user.update.mock.calls[0][0].data).toMatchObject({
          appleId: null,
          appleRefreshToken: null,
        });
      });

      it('still deletes the account when the revoke request throws', async () => {
        prisma.user.findUnique.mockResolvedValue(appleUser());
        fetchMock.mockRejectedValue(new Error('network down'));

        const result = await service.deleteAccount(
          { id: USER_ID },
          { password: 'correct-password' },
        );

        expect(result).toEqual({ message: 'Your account has been deleted.' });
        expect(prisma.user.update.mock.calls[0][0].data.appleRefreshToken).toBeNull();
        expect(warnSpy.mock.calls.flat().join(' ')).not.toContain('apple-refresh-fixture');
      });

      it('still deletes the account when Apple returns an error status', async () => {
        prisma.user.findUnique.mockResolvedValue(appleUser());
        fetchMock.mockResolvedValue({ ok: false, status: 503 });

        const result = await service.deleteAccount(
          { id: USER_ID },
          { password: 'correct-password' },
        );

        expect(result).toEqual({ message: 'Your account has been deleted.' });
        expect(prisma.user.update).toHaveBeenCalledTimes(1);
      });

      it('does not call Apple when the user has no stored refresh token', async () => {
        prisma.user.findUnique.mockResolvedValue(buildUser({ appleId: 'apple-sub-1' }));

        await service.deleteAccount({ id: USER_ID }, { password: 'correct-password' });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(prisma.user.update).toHaveBeenCalledTimes(1);
      });

      it('skips the revoke but still clears the token when Apple env vars are missing', async () => {
        configService.get.mockReturnValue(undefined);
        prisma.user.findUnique.mockResolvedValue(appleUser());

        const result = await service.deleteAccount(
          { id: USER_ID },
          { password: 'correct-password' },
        );

        expect(result).toEqual({ message: 'Your account has been deleted.' });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(prisma.user.update.mock.calls[0][0].data.appleRefreshToken).toBeNull();
      });

      it('skips the revoke when FIELD_ENCRYPTION_KEY is missing', async () => {
        const user = appleUser();
        delete process.env.FIELD_ENCRYPTION_KEY;
        prisma.user.findUnique.mockResolvedValue(user);

        await service.deleteAccount({ id: USER_ID }, { password: 'correct-password' });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(prisma.user.update).toHaveBeenCalledTimes(1);
      });
    });

    it('rejects deleting an already-deleted account', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser({ deletedAt: new Date() }));

      await expect(
        service.deleteAccount({ id: USER_ID }, { password: 'correct-password' }),
      ).rejects.toThrow(/already been deleted/i);
    });
  });
});
