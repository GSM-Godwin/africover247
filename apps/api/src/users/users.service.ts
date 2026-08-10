import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  // --- Get user by id ---

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...rest } = user;
    return rest;
  }

  // --- Update profile ---

  async updateProfile(id: string, dto: UpdateProfileDto) {
    await this.findById(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: dto,
    });
    const { passwordHash, ...rest } = updated;
    return rest;
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

    return { message: 'Password changed successfully' };
  }

  async savePushToken(userId: string, token: string, platform: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushToken: token, pushPlatform: platform },
    });
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

    return this.prisma.user.update({
      where: { id },
      data: {
        suspended: true,
        suspendedReason: reason,
        suspendedAt: new Date(),
      },
    });
  }

  async unsuspendUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: {
        suspended: false,
        suspendedReason: null,
        suspendedAt: null,
      },
    });
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
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const { role, ...rest } = dto;

    return this.prisma.user.update({
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
}
