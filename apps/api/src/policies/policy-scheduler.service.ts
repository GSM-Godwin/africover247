import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PolicySchedulerService {
  private readonly logger = new Logger(PolicySchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendPolicyExpiryReminders() {
    const now = new Date();
    const reminderDays = [30, 14, 7, 3, 1];

    for (const days of reminderDays) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const policies = await this.prisma.policy.findMany({
        where: {
          status: 'active',
          expiryDate: {
            gte: targetDate,
            lt: nextDay,
          },
        },
        include: {
          user: { select: { id: true, email: true, firstName: true } },
          product: { select: { name: true } },
        },
      });

      for (const policy of policies) {
        const message = `Your ${policy.product.name} policy (${policy.policyNumber}) expires in ${days} day${days !== 1 ? 's' : ''}. Renew now to stay protected.`;

        this.logger.log(
          `[PolicyScheduler] Expiry reminder — ${policy.policyNumber} (${days} days left) → ${policy.user.email}`,
        );

        try {
          await this.notificationsService.create({
            userId: policy.user.id,
            message,
            type: 'policy_expiry',
            referenceType: 'policy',
            referenceId: policy.id,
          });
        } catch {}

        try {
          await this.emailService.sendPolicyExpiryReminderEmail(
            policy.user.email,
            policy.user.firstName,
            policy.policyNumber,
            policy.product.name,
            policy.expiryDate,
            days,
          );
        } catch {}
      }
    }

    this.logger.log('[PolicyScheduler] Policy expiry reminder check complete');
  }
}
