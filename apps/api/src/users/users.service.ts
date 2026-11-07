import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';
import { AuthService } from '../auth/auth.service';
import { AppleTokenService } from '../auth/apple-token.service';
import { safeUser } from '../common/helpers/safe-user';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';

const FRESH_LOGIN_WINDOW_SECONDS = 5 * 60;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
    private readonly appleTokenService: AppleTokenService,
  ) {}

  // --- Get user by id ---

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return safeUser(user);
  }

  // --- Update profile ---

  async updateProfile(id: string, dto: UpdateProfileDto) {
    await this.findById(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
    });
    return safeUser(updated);
  }

  // --- Change password ---

  async changePassword(id: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const passwordMatch = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!passwordMatch)
      throw new BadRequestException('Current password is incorrect');

    const isSamePassword = await bcrypt.compare(
      dto.newPassword,
      user.passwordHash,
    );
    if (isSamePassword)
      throw new BadRequestException(
        'New password must be different from your current password',
      );

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    await this.authService.incrementTokenVersion(id);

    return { message: 'Password changed successfully' };
  }

  // --- Delete account (self-service, anonymise rather than hard-delete) ---

  async deleteAccount(
    authUser: { id: string; iat?: number },
    dto: DeleteAccountDto,
  ) {
    const userId = authUser.id;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.deletedAt) {
      throw new BadRequestException('This account has already been deleted');
    }

    if (dto.password) {
      const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!passwordMatch) throw new BadRequestException('Incorrect password');
    } else {
      const issuedAt = authUser.iat;
      const freshEnough =
        typeof issuedAt === 'number' &&
        Date.now() / 1000 - issuedAt <= FRESH_LOGIN_WINDOW_SECONDS;
      if (!freshEnough) {
        throw new UnauthorizedException(
          'For your security, please log out, log back in, and try deleting your account again.',
        );
      }
    }

    const [activePolicy, openClaim] = await Promise.all([
      this.prisma.policy.findFirst({ where: { userId, status: 'active' } }),
      this.prisma.claim.findFirst({
        where: { userId, status: { in: ['submitted', 'in_review'] } },
      }),
    ]);

    if (activePolicy) {
      throw new BadRequestException(
        'You have an active policy. Please contact support to cancel it before deleting your account.',
      );
    }
    if (openClaim) {
      throw new BadRequestException(
        'You have an open claim. Please contact support before deleting your account.',
      );
    }

    if (user.appleRefreshToken) {
      await this.appleTokenService.revokeRefreshToken(user.appleRefreshToken);
    }

    const placeholderEmail = `deleted-${userId}@deleted.invalid`;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: 'Deleted',
        lastName: 'User',
        email: placeholderEmail,
        phone: null,
        alternativePhone: null,
        googleId: null,
        appleId: null,
        appleRefreshToken: null,
        pushToken: null,
        pushPlatform: null,
        kycData: Prisma.DbNull,
        kycVerified: false,
        kycVerifiedAt: null,
        kycVerificationType: null,
        deletedAt: new Date(),
        tokenVersion: { increment: 1 },
      },
    });

    await this.adminService.createAuditLog({
      actorId: userId,
      action: 'USER_ACCOUNT_DELETED',
      entityType: 'User',
      entityId: userId,
    });

    this.logger.log(`Account ${userId} deleted (self-service, anonymised)`);

    return { message: 'Your account has been deleted.' };
  }

  async savePushToken(userId: string, token: string, platform: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: token, pushPlatform: platform },
    });
    return safeUser(user);
  }

  async getAllUsers(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role: role as 'customer' | 'admin' } : undefined,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        suspended: true,
        suspendedReason: true,
        suspendedAt: true,
        createdAt: true,
        _count: {
          select: { policies: true, claims: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async suspendUser(id: string, reason: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new BadRequestException('You cannot suspend your own account');
    }
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'admin') throw new BadRequestException('Cannot suspend an admin account');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        suspended: true,
        suspendedReason: reason,
        suspendedAt: new Date(),
      },
    });

    await this.adminService.createAuditLog({
      actorId: requestingUserId,
      action: 'SUSPEND_USER',
      entityType: 'User',
      entityId: id,
      details: { reason },
    });

    return safeUser(updated);
  }

  async unsuspendUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        suspended: false,
        suspendedReason: null,
        suspendedAt: null,
      },
    });

    await this.adminService.createAuditLog({
      actorId: adminId,
      action: 'UNSUSPEND_USER',
      entityType: 'User',
      entityId: id,
    });

    return safeUser(updated);
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        suspended: true,
        suspendedReason: true,
        suspendedAt: true,
        createdAt: true,
        _count: {
          select: { policies: true, claims: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async adminUpdateUser(
    id: string,
    dto: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: string;
      emailVerified?: boolean;
    },
    adminId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: dto.phone, NOT: { id } },
      });
      if (existingPhone) {
        throw new ConflictException('This phone number is already used by another account.');
      }
    }

    const { role, ...rest } = dto;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...rest,
        ...(role !== undefined ? { role: role as 'customer' | 'admin' } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
      },
    });

    await this.adminService.createAuditLog({
      actorId: adminId,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: id,
      details: { fields: Object.keys(dto) },
    });

    return updated;
  }

  async adminDeleteUser(id: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.emailVerification.deleteMany({ where: { userId: id } });
    await this.prisma.passwordReset.deleteMany({ where: { userId: id } });
    await this.prisma.notification.deleteMany({ where: { userId: id } });
    await this.prisma.auditLog.deleteMany({ where: { actorId: id } });
    await this.prisma.claimStatusHistory.deleteMany({ where: { changedBy: id } });
    await this.prisma.claimComment.deleteMany({ where: { userId: id } });

    const claims = await this.prisma.claim.findMany({
      where: { userId: id },
      select: { id: true },
    });
    const claimIds = claims.map((c) => c.id);
    if (claimIds.length > 0) {
      await this.prisma.claimDocument.deleteMany({ where: { claimId: { in: claimIds } } });
      await this.prisma.claimStatusHistory.deleteMany({ where: { claimId: { in: claimIds } } });
      await this.prisma.claimComment.deleteMany({ where: { claimId: { in: claimIds } } });
      await this.prisma.claim.deleteMany({ where: { userId: id } });
    }

    await this.prisma.policy.deleteMany({ where: { userId: id } });

    const applications = await this.prisma.application.findMany({
      where: { userId: id },
      select: { id: true },
    });
    const appIds = applications.map((a) => a.id);
    if (appIds.length > 0) {
      await this.prisma.payment.deleteMany({ where: { applicationId: { in: appIds } } });
      await this.prisma.kycDocument.deleteMany({ where: { applicationId: { in: appIds } } });
      await this.prisma.application.deleteMany({ where: { userId: id } });
    }

    const quotes = await this.prisma.quote.findMany({
      where: { customerId: id },
      select: { id: true },
    });
    const quoteIds = quotes.map((q) => q.id);
    if (quoteIds.length > 0) {
      await this.prisma.notification.deleteMany({ where: { quoteId: { in: quoteIds } } });
    }
    await this.prisma.quote.deleteMany({ where: { customerId: id } });

    await this.prisma.user.delete({ where: { id } });

    this.logger.log(`User ${user.email} deleted by admin`);

    return { deleted: true, email: user.email };
  }

  findAll(search?: string) {
    const where: Prisma.UserWhereInput = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePreferences(userId: string, dto: { preferredChannel?: string; renewalReminderPref?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        preferredChannel: dto.preferredChannel,
        renewalReminderPref: dto.renewalReminderPref,
      },
      select: { preferredChannel: true, renewalReminderPref: true },
    });
  }
}
