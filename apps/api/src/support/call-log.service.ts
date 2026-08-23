import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CallLogService {
  constructor(private readonly prisma: PrismaService) {}

  createLog(
    adminId: string,
    dto: {
      customerName: string;
      customerPhone: string;
      direction: string;
      duration?: number;
      topic: string;
      notes?: string;
      outcome: string;
      calledAt?: string;
    },
  ) {
    return this.prisma.callLog.create({
      data: {
        adminId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        direction: dto.direction || 'outbound',
        duration: dto.duration,
        topic: dto.topic,
        notes: dto.notes,
        outcome: dto.outcome,
        calledAt: dto.calledAt ? new Date(dto.calledAt) : new Date(),
      },
    });
  }

  getLogs(filters: {
    adminId?: string;
    from?: string;
    to?: string;
    search?: string;
  }) {
    const where: Prisma.CallLogWhereInput = {};
    if (filters.adminId) where.adminId = filters.adminId;
    if (filters.from || filters.to) {
      where.calledAt = {};
      if (filters.from) where.calledAt.gte = new Date(filters.from);
      if (filters.to) where.calledAt.lte = new Date(filters.to);
    }
    if (filters.search) {
      where.OR = [
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { customerPhone: { contains: filters.search } },
        { topic: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.callLog.findMany({
      where,
      include: {
        admin: { select: { firstName: true, lastName: true } },
      },
      orderBy: { calledAt: 'desc' },
      take: 100,
    });
  }

  async getStats() {
    const [total, outbound, inbound, todayTotal] = await Promise.all([
      this.prisma.callLog.count(),
      this.prisma.callLog.count({ where: { direction: 'outbound' } }),
      this.prisma.callLog.count({ where: { direction: 'inbound' } }),
      this.prisma.callLog.count({
        where: {
          calledAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);
    return { total, outbound, inbound, todayTotal };
  }

  deleteLog(id: string) {
    return this.prisma.callLog.delete({ where: { id } });
  }
}
