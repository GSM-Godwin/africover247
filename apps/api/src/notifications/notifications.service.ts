import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
  ) {}

  findMyNotifications(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

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

  async create(data: {
    userId: string;
    message: string;
    type: string;
    referenceType?: string;
    referenceId?: string;
  }) {
    const notification = await this.prisma.notification.create({ data });

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { pushToken: true, firstName: true },
      });
      if (user?.pushToken) {
        await this.firebase.sendPushToUser(
          user.pushToken,
          this.getNotificationTitle(data.type),
          data.message,
          {
            type: data.type,
            referenceType: data.referenceType || '',
            referenceId: data.referenceId || '',
          },
        );
      }
    } catch {}

    return notification;
  }

  private getNotificationTitle(type: string): string {
    const titles: Record<string, string> = {
      quote_received: 'Quote Request Received',
      quote_sent: 'Quote Ready',
      quote_deadline: 'Quote Deadline Alert',
      claim_update: 'Claim Update',
      policy_expiry: 'Policy Expiring Soon',
      payment_confirmed: 'Payment Confirmed',
    };
    return titles[type] || 'AfriCover247';
  }
}
