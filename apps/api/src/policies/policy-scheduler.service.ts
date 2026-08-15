import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SmsService } from '../sms/sms.service';
import { PoliciesService } from './policies.service';

const REMINDER_SCHEDULE = [
  { days: 90, type: 'reminder_90d', urgent: false, channels: ['email', 'inapp'] },
  { days: 60, type: 'reminder_60d', urgent: false, channels: ['email', 'push', 'inapp'] },
  { days: 45, type: 'reminder_45d', urgent: false, channels: ['push', 'email', 'inapp'] },
  { days: 30, type: 'reminder_30d', urgent: false, channels: ['push', 'email', 'sms', 'inapp'] },
  { days: 14, type: 'reminder_14d', urgent: true, channels: ['push', 'email', 'sms', 'inapp'] },
  { days: 7, type: 'reminder_7d', urgent: true, channels: ['push', 'email', 'sms', 'inapp'] },
  { days: 3, type: 'reminder_3d', urgent: true, channels: ['push', 'sms', 'inapp'] },
  { days: 1, type: 'reminder_1d', urgent: true, channels: ['push', 'sms', 'inapp'] },
  { days: 0, type: 'expiry_day', urgent: true, channels: ['push', 'email', 'sms', 'inapp'] },
  { days: -1, type: 'post_expiry_1d', urgent: true, channels: ['email', 'push', 'inapp'] },
  { days: -7, type: 'post_expiry_7d', urgent: true, channels: ['email', 'inapp'] },
  { days: -30, type: 'post_expiry_30d', urgent: false, channels: ['email', 'inapp'] },
];

const REMINDER_MESSAGES: Record<string, { title: string; message: string; renewalStatus: string }> = {
  reminder_90d: {
    title: 'Policy renewal in 90 days',
    message: 'Your {product} policy expires in 90 days. Start planning your renewal early.',
    renewalStatus: 'NOT_YET_DUE',
  },
  reminder_60d: {
    title: 'Time to renew your policy',
    message: 'Your {product} policy expires in 60 days. Renew now to avoid any gap in cover.',
    renewalStatus: 'RENEWAL_OPEN',
  },
  reminder_45d: {
    title: 'Policy renewal reminder',
    message: 'Your {product} policy expires in 45 days. Renew now to stay protected.',
    renewalStatus: 'RENEWAL_OPEN',
  },
  reminder_30d: {
    title: 'Your policy expires in 30 days',
    message: 'Your {product} policy expires in 30 days. Renew now to avoid a gap in cover.',
    renewalStatus: 'RENEWAL_DUE',
  },
  reminder_14d: {
    title: 'Urgent: Policy expires in 14 days',
    message: 'Your {product} policy expires in 14 days. Renew now to stay protected.',
    renewalStatus: 'RENEWAL_DUE',
  },
  reminder_7d: {
    title: 'Critical: Policy expires in 7 days',
    message: 'Your {product} policy expires in 7 days. Renew immediately to avoid a gap in cover.',
    renewalStatus: 'RENEWAL_DUE',
  },
  reminder_3d: {
    title: 'Final reminder: Policy expires in 3 days',
    message: 'Your {product} policy expires in 3 days. Renew now.',
    renewalStatus: 'RENEWAL_DUE',
  },
  reminder_1d: {
    title: 'Your policy expires tomorrow',
    message: 'Your {product} policy expires tomorrow. Renew now to avoid being uninsured.',
    renewalStatus: 'RENEWAL_DUE',
  },
  expiry_day: {
    title: 'Your policy expires today',
    message: 'Your {product} policy expires today. Renew now if you want continuous cover.',
    renewalStatus: 'RENEWAL_DUE',
  },
  post_expiry_1d: {
    title: 'Your policy has expired',
    message: 'Your {product} policy expired yesterday. You may need to complete a new application to reinstate cover.',
    renewalStatus: 'RENEWAL_EXPIRED',
  },
  post_expiry_7d: {
    title: 'Policy expired 7 days ago',
    message: 'Your {product} policy expired 7 days ago. Check your renewal options now.',
    renewalStatus: 'RENEWAL_EXPIRED',
  },
  post_expiry_30d: {
    title: 'Final renewal reminder',
    message: 'Your {product} policy expired 30 days ago. This is our final renewal reminder.',
    renewalStatus: 'RENEWAL_EXPIRED',
  },
};

@Injectable()
export class PolicySchedulerService {
  private readonly logger = new Logger(PolicySchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly smsService: SmsService,
    private readonly policiesService: PoliciesService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async runRenewalEngine() {
    await this.policiesService.unsnoozePolicies();

    this.logger.log('[RenewalEngine] Starting daily renewal check');
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const policies = await this.prisma.policy.findMany({
      where: {
        status: { in: ['active', 'renewal_due', 'expired'] as any },
        remindersSupressed: false,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, phone: true, pushToken: true } },
        product: { select: { name: true, category: true } },
        renewalLogs: { orderBy: { sentAt: 'desc' }, take: 1 },
      },
    });

    this.logger.log(`[RenewalEngine] Checking ${policies.length} policies`);

    for (const policy of policies) {
      if (policy.product.category === 'Travel' && policy.product.name.toLowerCase().includes('single')) continue;

      if (['Life'].includes(policy.product.category)) continue;

      const expiryDate = new Date(policy.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      for (const schedule of REMINDER_SCHEDULE) {
        if (daysUntilExpiry !== schedule.days) continue;

        const alreadySent = policy.renewalLogs.some(
          (log) => log.reminderType === schedule.type,
        );
        if (alreadySent) continue;

        await this.sendRenewalReminder(policy, schedule, daysUntilExpiry);
        break;
      }

      await this.updatePolicyRenewalStatus(policy, daysUntilExpiry);
    }

    this.logger.log('[RenewalEngine] Daily renewal check complete');
  }

  private async sendRenewalReminder(
    policy: any,
    schedule: typeof REMINDER_SCHEDULE[0],
    daysUntilExpiry: number,
  ) {
    const template = REMINDER_MESSAGES[schedule.type];
    if (!template) return;

    const productName = policy.product.name;
    const message = template.message.replace(/{product}/g, productName);
    const title = template.title;

    this.logger.log(`[RenewalEngine] Sending ${schedule.type} for policy ${policy.policyNumber}`);

    if (schedule.channels.includes('inapp')) {
      try {
        await this.notificationsService.create({
          userId: policy.user.id,
          message,
          type: 'policy_renewal',
          referenceType: 'policy',
          referenceId: policy.id,
        });
      } catch {}
    }

    if (schedule.channels.includes('email')) {
      try {
        await this.emailService.sendPolicyExpiryReminderEmail(
          policy.user.email,
          policy.user.firstName,
          policy.policyNumber,
          productName,
          policy.expiryDate,
          Math.abs(daysUntilExpiry),
        );
      } catch {}
    }

    if (schedule.channels.includes('sms') && policy.user.phone) {
      try {
        await this.smsService.sendNotificationSms(
          policy.user.phone,
          `AfriCover247: ${message} Policy: ${policy.policyNumber}`,
        );
      } catch {}
    }

    await this.prisma.renewalLog.create({
      data: {
        policyId: policy.id,
        reminderType: schedule.type,
        channels: schedule.channels,
      },
    });

    await this.prisma.policy.update({
      where: { id: policy.id },
      data: {
        lastReminderSentAt: new Date(),
        lastReminderType: schedule.type,
        renewalStatus: template.renewalStatus,
      },
    });
  }

  private async updatePolicyRenewalStatus(policy: any, daysUntilExpiry: number) {
    let newStatus: string | null = null;
    let policyStatus: any = null;

    if (daysUntilExpiry > 30) {
      newStatus = 'NOT_YET_DUE';
    } else if (daysUntilExpiry > 14) {
      newStatus = 'RENEWAL_OPEN';
      policyStatus = 'renewal_due';
    } else if (daysUntilExpiry > 0) {
      newStatus = 'RENEWAL_DUE';
      policyStatus = 'renewal_due';
    } else if (daysUntilExpiry === 0) {
      newStatus = 'RENEWAL_DUE';
      policyStatus = 'renewal_due';
    } else {
      newStatus = 'RENEWAL_EXPIRED';
      policyStatus = 'expired';
    }

    if (newStatus && newStatus !== policy.renewalStatus) {
      await this.prisma.policy.update({
        where: { id: policy.id },
        data: {
          renewalStatus: newStatus,
          ...(policyStatus ? { status: policyStatus } : {}),
        },
      });
    }
  }
}
