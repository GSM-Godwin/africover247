import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // --- Dashboard metrics ---

  async getMetrics() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [
      totalApplications,
      activeApplications,
      activePolicies,
      pendingClaims,
      totalClaims,
      newThisWeek,
      totalUsers,
      applicationsThisWeek,
      newCustomersThisWeek,
      revenueResult,
    ] = await Promise.all([
      this.prisma.application.count(),
      this.prisma.application.count({
        where: { status: { in: ['draft', 'pending_payment'] } },
      }),
      this.prisma.policy.count({ where: { status: 'active' } }),
      this.prisma.claim.count({
        where: { status: { in: ['submitted', 'in_review'] } },
      }),
      this.prisma.claim.count(),
      this.prisma.application.count({
        where: { createdAt: { gte: oneWeekAgo } },
      }),
      this.prisma.user.count({ where: { role: 'customer' } }),
      this.prisma.application.count({
        where: { createdAt: { gte: oneWeekAgo } },
      }),
      this.prisma.user.count({
        where: {
          role: 'customer',
          createdAt: { gte: oneWeekAgo },
        },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'successful' },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = Number(revenueResult._sum.amount || 0);

    return {
      totalApplications,
      activeApplications,
      activePolicies,
      pendingClaims,
      totalClaims,
      newThisWeek,
      totalUsers,
      applicationsThisWeek,
      newCustomersThisWeek,
      totalRevenue,
    };
  }

  // --- Recent activity feed ---

  async getActivity(limit = 10) {
    const logs = await this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      createdAt: log.createdAt,
      user: {
        firstName: log.actor.firstName,
        lastName: log.actor.lastName,
      },
    }));
  }

  // --- Pending claims for dashboard ---

  getPendingClaims(limit = 5) {
    return this.prisma.claim.findMany({
      where: { status: { in: ['submitted', 'in_review'] } },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        policy: {
          include: {
            product: { select: { name: true } },
          },
        },
      },
    });
  }

  // --- Recent applications for dashboard ---

  getRecentApplications(limit = 5) {
    return this.prisma.application.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { name: true, category: true } },
      },
    });
  }

  // --- Create audit log entry ---

  createAuditLog(data: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    details?: object;
  }) {
    return this.prisma.auditLog.create({
      data: {
        ...data,
        details: data.details as Prisma.InputJsonValue | undefined,
      },
    });
  }

  // --- Get audit logs with filters ---

  getAuditLogs(filters: {
    search?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (filters.actorId) where.actorId = filters.actorId;

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { entityType: { contains: filters.search, mode: 'insensitive' } },
        { entityId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }
}
