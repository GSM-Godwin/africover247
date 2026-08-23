import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { getSlaStatus } from './sla.config';

@Injectable()
export class SlaSchedulerService {
  private readonly logger = new Logger(SlaSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 * * * *')
  async checkSlaBreaches() {
    this.logger.log('[SLA] Running hourly SLA breach check');

    const openTickets = await this.prisma.supportTicket.findMany({
      where: {
        status: { notIn: ['resolved', 'closed'] },
        slaDeadline: { not: null },
      },
    });

    for (const ticket of openTickets) {
      const status = getSlaStatus(ticket.slaDeadline, ticket.status);

      if (status === 'breached' && !ticket.slaBreached) {
        await this.prisma.supportTicket.update({
          where: { id: ticket.id },
          data: { slaBreached: true },
        });

        if (!ticket.slaBreachNotified) {
          try {
            await this.emailService.sendEmail({
              to: ticket.email,
              subject: `Update on your support request #${ticket.id.slice(0, 8).toUpperCase()}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #15679b; padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0;">AfriCover247</h1>
                  </div>
                  <div style="padding: 32px;">
                    <p>Dear ${ticket.name},</p>
                    <p>We sincerely apologise for the delay in responding to your support request <strong>#${ticket.id.slice(0, 8).toUpperCase()}</strong>.</p>
                    <p>We are still working on your request and will respond as soon as possible. We appreciate your patience.</p>
                    <p style="color: #5C6478; font-size: 14px;">
                      If this is urgent, please contact us directly at 
                      <a href="mailto:info@afriglobal.com.ng" style="color: #15679b;">info@afriglobal.com.ng</a>
                      or call 08101315330.
                    </p>
                  </div>
                </div>
              `,
            });

            await this.prisma.supportTicket.update({
              where: { id: ticket.id },
              data: { slaBreachNotified: true },
            });
          } catch {}
        }

        try {
          const admins = await this.prisma.user.findMany({
            where: { role: 'admin' },
            select: { id: true },
          });
          for (const admin of admins) {
            await this.notificationsService.create({
              userId: admin.id,
              message: `SLA breached: Ticket #${ticket.id.slice(0, 8).toUpperCase()} — ${ticket.subject} (${ticket.category.replace(/_/g, ' ')})`,
              type: 'sla_breach',
              referenceType: 'ticket',
              referenceId: ticket.id,
            });
          }
        } catch {}

        this.logger.warn(`[SLA] Breach detected: ticket ${ticket.id.slice(0, 8).toUpperCase()}`);
      }

      if (status === 'at_risk') {
        this.logger.log(`[SLA] At risk: ticket ${ticket.id.slice(0, 8).toUpperCase()}`);
      }
    }

    this.logger.log(`[SLA] Check complete — ${openTickets.length} open tickets checked`);
  }
}
