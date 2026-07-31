import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
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

  async savePushToken(userId: string, pushToken: string, platform: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pushToken,
        pushPlatform: platform,
      },
    });
    return { saved: true };
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
        createdAt: true,
        _count: {
          select: { policies: true, claims: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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

    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
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
