jest.mock('bcrypt');

jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => ({})),
  jwtVerify: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';
import { AuthService } from '../auth/auth.service';

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

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      policy: { findFirst: jest.fn().mockResolvedValue(null) },
      claim: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    adminService = { createAuditLog: jest.fn() };
    authService = { incrementTokenVersion: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AdminService, useValue: adminService },
        { provide: AuthService, useValue: authService },
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

    it('rejects deleting an already-deleted account', async () => {
      prisma.user.findUnique.mockResolvedValue(buildUser({ deletedAt: new Date() }));

      await expect(
        service.deleteAccount({ id: USER_ID }, { password: 'correct-password' }),
      ).rejects.toThrow(/already been deleted/i);
    });
  });
});
