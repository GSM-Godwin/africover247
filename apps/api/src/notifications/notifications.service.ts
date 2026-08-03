import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // --- List user notifications ---

  findMyNotifications(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Get unread count ---

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  // --- Mark single notification as read ---

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId)
      throw new ForbiddenException(
        'You do not have access to this notification',
      );

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  // --- Mark all as read ---

  async markAllAsRead(userId: string): Promise<{ message: string; updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return {
      message: 'All notifications marked as read',
      updated: result.count,
    };
  }

  async markReadByReference(
    userId: string,
    referenceType: string,
    referenceId: string,
  ) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        referenceType,
        referenceId,
        read: false,
      },
      data: { read: true },
    });
  }

  create(data: {
    userId: string;
    message: string;
    type: string;
    referenceType?: string;
    referenceId?: string;
  }) {
    return this.prisma.notification.create({ data });
  }
}
