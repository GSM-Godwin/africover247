import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AdminService } from '../admin/admin.service';
import { TicketCategory, TicketStatus } from '@prisma/client';
import { getSlaDeadline, getSlaStatus, getCompletionTime } from './sla.config';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly adminService: AdminService,
  ) {}

  async createTicket(dto: {
    userId?: string;
    name: string;
    email: string;
    phone?: string;
    category: string;
    subject: string;
    message: string;
    referenceId?: string;
    referenceType?: string;
  }) {
    const slaDeadline = getSlaDeadline(dto.category, new Date());

    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId: dto.userId || null,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        category: dto.category as TicketCategory,
        subject: dto.subject,
        message: dto.message,
        referenceId: dto.referenceId,
        referenceType: dto.referenceType,
        slaDeadline,
      },
    });

    try {
      await this.emailService.sendEmail({
        to: dto.email,
        subject: `Support request received — ${ticket.id.slice(0, 8).toUpperCase()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #15679b; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">AfriCover247</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">Support Team</p>
            </div>
            <div style="padding: 32px;">
              <p>Dear ${dto.name},</p>
              <p>We have received your support request and will respond within 24 hours.</p>
              <div style="background: #EBF4FA; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; color: #5C6478; text-transform: uppercase;">Ticket Reference</p>
                <p style="margin: 8px 0 0; font-size: 24px; font-weight: 800; color: #15679b; font-family: monospace;">
                  #${ticket.id.slice(0, 8).toUpperCase()}
                </p>
                <p style="margin: 8px 0 0; color: #5C6478;">${dto.subject}</p>
              </div>
              <p style="color: #5C6478; font-size: 14px;">
                You can track your request status by logging into AfriCover247 and visiting Help & Support.
              </p>
            </div>
            <div style="background: #F0F4F8; padding: 16px; text-align: center;">
              <p style="color: #5C6478; font-size: 12px; margin: 0;">
                AfriGlobal Insurance Brokers Limited · Support hours: Mon–Sat 8am–6pm
              </p>
            </div>
          </div>
        `,
      });

      await this.emailService.sendEmail({
        to: 'info@afriglobal.com.ng',
        subject: `New support ticket #${ticket.id.slice(0, 8).toUpperCase()} — ${dto.category}`,
        html: `
          <p>New support ticket from ${dto.name} (${dto.email})</p>
          <p><strong>Category:</strong> ${dto.category}</p>
          <p><strong>Subject:</strong> ${dto.subject}</p>
          <p><strong>Message:</strong> ${dto.message}</p>
          ${dto.phone ? `<p><strong>Phone:</strong> ${dto.phone}</p>` : ''}
          ${dto.referenceId ? `<p><strong>Reference:</strong> ${dto.referenceType} ${dto.referenceId}</p>` : ''}
        `,
      });
    } catch {}

    return ticket;
  }

  async getMyTickets(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { userId },
      include: { responses: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return tickets.map((ticket) => ({
      ...ticket,
      slaStatus: getSlaStatus(ticket.slaDeadline, ticket.status),
      completionTime: ticket.resolvedAt
        ? getCompletionTime(ticket.createdAt, ticket.resolvedAt)
        : null,
    }));
  }

  async getTicketById(id: string, userId?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: { responses: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (userId && ticket.userId && ticket.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return {
      ...ticket,
      slaStatus: getSlaStatus(ticket.slaDeadline, ticket.status),
      completionTime: ticket.resolvedAt
        ? getCompletionTime(ticket.createdAt, ticket.resolvedAt)
        : null,
    };
  }

  async addResponse(
    ticketId: string,
    message: string,
    isAdmin: boolean,
    userId?: string,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isAdmin && userId && ticket.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const response = await this.prisma.ticketResponse.create({
      data: { ticketId, message, isAdmin },
    });

    if (isAdmin && !ticket.firstResponseAt) {
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { firstResponseAt: new Date() },
      });
    }

    if (isAdmin && ticket.email) {
      try {
        await this.emailService.sendEmail({
          to: ticket.email,
          subject: `Update on your support request #${ticketId.slice(0, 8).toUpperCase()}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #15679b; padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0;">AfriCover247</h1>
              </div>
              <div style="padding: 32px;">
                <p>Dear ${ticket.name},</p>
                <p>Our support team has responded to your request:</p>
                <div style="background: #F7F8FA; border-left: 4px solid #15679b; padding: 16px; margin: 24px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #1a1a2e;">${message}</p>
                </div>
                <p style="color: #5C6478; font-size: 14px;">
                  Log in to AfriCover247 to reply or view your full ticket history.
                </p>
              </div>
            </div>
          `,
        });
      } catch {}
    }

    return response;
  }

  async updateTicketStatus(id: string, status: string, adminNote?: string, adminId?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const isResolved = status === 'resolved' || status === 'closed';
    const resolvedAt = isResolved ? new Date() : undefined;
    const slaBreached = ticket.slaDeadline
      ? new Date() > ticket.slaDeadline && !isResolved
      : false;

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        status: status as TicketStatus,
        adminNote,
        resolvedAt,
        slaBreached: isResolved ? ticket.slaBreached : slaBreached,
      },
    });

    if (adminId) {
      await this.adminService.createAuditLog({
        actorId: adminId,
        action: 'TICKET_STATUS_UPDATED',
        entityType: 'SupportTicket',
        entityId: id,
        details: { status, adminNote },
      });
    }

    return updated;
  }

  async getAllTickets(status?: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: status ? { status: status as TicketStatus } : undefined,
      include: {
        responses: { orderBy: { createdAt: 'asc' } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((ticket) => ({
      ...ticket,
      slaStatus: getSlaStatus(ticket.slaDeadline, ticket.status),
      completionTime: ticket.resolvedAt
        ? getCompletionTime(ticket.createdAt, ticket.resolvedAt)
        : null,
    }));
  }

  async getTicketStats() {
    const [open, inProgress, awaitingCustomer, resolved, total] =
      await Promise.all([
        this.prisma.supportTicket.count({ where: { status: 'open' } }),
        this.prisma.supportTicket.count({ where: { status: 'in_progress' } }),
        this.prisma.supportTicket.count({
          where: { status: 'awaiting_customer' },
        }),
        this.prisma.supportTicket.count({ where: { status: 'resolved' } }),
        this.prisma.supportTicket.count(),
      ]);
    return { open, inProgress, awaitingCustomer, resolved, total };
  }

  async createAppointment(dto: {
    userId?: string;
    name: string;
    email: string;
    phone: string;
    preferredDate: Date;
    alternateDate?: Date;
    topic: string;
    notes?: string;
  }) {
    const appointment = await this.prisma.appointment.create({
      data: {
        userId: dto.userId || null,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        preferredDate: dto.preferredDate,
        alternateDate: dto.alternateDate,
        topic: dto.topic,
        notes: dto.notes,
      },
    });

    try {
      await this.emailService.sendEmail({
        to: dto.email,
        subject: 'Appointment request received — AfriCover247',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #15679b; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0;">AfriCover247</h1>
            </div>
            <div style="padding: 32px;">
              <p>Dear ${dto.name},</p>
              <p>Your appointment request has been received. Our team will confirm your preferred time within 24 hours.</p>
              <div style="background: #EBF4FA; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; color: #5C6478;">Preferred Date</p>
                <p style="margin: 8px 0 0; font-size: 18px; font-weight: 800; color: #15679b;">
                  ${new Date(dto.preferredDate).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p style="margin: 8px 0 0; color: #5C6478;"><strong>Topic:</strong> ${dto.topic}</p>
              </div>
              <p style="color: #5C6478; font-size: 14px;">Appointments are available Mon–Fri 9am–6pm, Sat 9am–1pm.</p>
            </div>
          </div>
        `,
      });

      await this.emailService.sendEmail({
        to: 'info@afriglobal.com.ng',
        subject: `New appointment request — ${dto.name}`,
        html: `
          <p><strong>Name:</strong> ${dto.name}</p>
          <p><strong>Email:</strong> ${dto.email}</p>
          <p><strong>Phone:</strong> ${dto.phone}</p>
          <p><strong>Topic:</strong> ${dto.topic}</p>
          <p><strong>Preferred Date:</strong> ${new Date(dto.preferredDate).toLocaleDateString('en-NG')}</p>
          ${dto.alternateDate ? `<p><strong>Alternate Date:</strong> ${new Date(dto.alternateDate).toLocaleDateString('en-NG')}</p>` : ''}
          ${dto.notes ? `<p><strong>Notes:</strong> ${dto.notes}</p>` : ''}
        `,
      });
    } catch {}

    return appointment;
  }

  async getMyAppointments(userId: string) {
    return this.prisma.appointment.findMany({
      where: { userId },
      orderBy: { preferredDate: 'asc' },
    });
  }

  async getAllAppointments() {
    return this.prisma.appointment.findMany({
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { preferredDate: 'asc' },
    });
  }

  async updateAppointment(
    id: string,
    status: string,
    confirmedDate?: Date,
    adminNote?: string,
  ) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status, confirmedDate, adminNote },
    });
  }
}
