import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { RespondQuoteDto } from './dto/respond-quote.dto';
import { CounterQuoteDto } from './dto/counter-quote.dto';

const MAX_ROUNDS = 3;
const QUOTE_EXPIRY_DAYS = 7;

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  private async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data: Record<string, string>,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { pushToken: true },
      });

      if (!user?.pushToken) return;

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify({
          to: user.pushToken,
          title,
          body,
          data,
          sound: 'default',
          priority: 'high',
          channelId: 'default',
        }),
      });

      this.logger.log(`[Push] Notification sent to user ${userId}`);
    } catch (err) {
      this.logger.warn(`[Push] Failed to send notification: ${err}`);
    }
  }

  // --- Create quote request ---

  async createQuote(userId: string, dto: CreateQuoteDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) throw new NotFoundException('Product not found');

    if (product.pricingType !== 'quote_based') {
      throw new BadRequestException(
        'This product does not require a quote — use the direct application flow',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const quote = await this.prisma.$transaction(async (tx) => {
      const newQuote = await tx.quote.create({
        data: {
          customerId: userId,
          productId: dto.productId,
          status: 'pending_review',
          customerDetails: dto.customerDetails as Prisma.InputJsonValue,
          negotiationHistory: [],
        },
        include: { product: true, customer: true },
      });

      await tx.notification.create({
        data: {
          userId,
          message: `Your quote request for ${product.name} has been received. AfriGlobal will respond within 3 business days.`,
          type: 'quote_received',
          referenceType: 'quote',
          referenceId: newQuote.id,
          quoteId: newQuote.id,
        },
      });

      return newQuote;
    });

    try {
      await this.emailService.sendEmail({
        to: user!.email,
        subject: `Quote request received — ${product.name}`,
        html: `
          <p>Dear ${user!.firstName},</p>
          <p>Your quote request for <strong>${product.name}</strong> has been received.</p>
          <p>AfriGlobal Insurance Brokers will review your request and respond within <strong>3 business days</strong>.</p>
          <p>You can track your quote status on your dashboard.</p>
          <p>Reference: ${quote.id}</p>
        `,
      });
    } catch {}

    if (user!.phone) {
      await this.smsService.sendNotificationSms(
        user!.phone,
        `AfriCover247: Your quote request for ${product.name} has been received. We will respond within 3 business days.`,
      );
    }

    this.logger.log(
      `Quote ${quote.id} created for user ${userId} — product: ${product.name}`,
    );

    return quote;
  }

  // --- Get customer quotes ---

  async getMyQuotes(userId: string) {
    return this.prisma.quote.findMany({
      where: { customerId: userId },
      include: {
        product: {
          select: { id: true, name: true, category: true, pricingType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Get single quote ---

  async getQuote(quoteId: string, userId: string, role: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        product: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!quote) throw new NotFoundException('Quote not found');

    if (role !== 'admin' && quote.customerId !== userId) {
      throw new UnauthorizedException('You do not have access to this quote');
    }

    if (
      quote.status === 'quote_sent' &&
      quote.expiresAt &&
      new Date() > quote.expiresAt
    ) {
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: 'expired' },
      });
      return { ...quote, status: 'expired' };
    }

    return quote;
  }

  // --- Admin: respond with quote ---

  async adminRespondToQuote(
    quoteId: string,
    dto: RespondQuoteDto,
    adminId: string,
  ) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { customer: true, product: true },
    });

    if (!quote) throw new NotFoundException('Quote not found');

    if (!['pending_review', 'countered_by_customer'].includes(quote.status)) {
      throw new BadRequestException(
        'This quote cannot be responded to in its current state',
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + QUOTE_EXPIRY_DAYS);

    const historyEntry = {
      actor: 'admin',
      actorId: adminId,
      action: 'quote_sent',
      amount: dto.quoteAmount,
      note: dto.note || null,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [
      ...((quote.negotiationHistory as object[]) || []),
      historyEntry,
    ];

    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'quote_sent',
        adminQuoteAmount: dto.quoteAmount,
        adminNote: dto.note || null,
        negotiationHistory: updatedHistory,
        expiresAt,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: quote.customerId,
        message: `AfriGlobal has sent you a quote for ${quote.product.name}. Amount: ₦${dto.quoteAmount.toLocaleString()}. Please review and respond within 7 days.`,
        type: 'quote_sent',
        referenceType: 'quote',
        referenceId: quoteId,
        quoteId,
      },
    });

    await this.sendPushNotification(
      quote.customerId,
      'Quote Ready — AfriCover247',
      `AfriGlobal has sent you a quote for ${quote.product.name}. ₦${dto.quoteAmount.toLocaleString()}/year`,
      { referenceType: 'quote', referenceId: quoteId, type: 'quote_sent' },
    );

    await this.emailService.sendEmail({
      to: quote.customer.email,
      subject: `Quote ready — ${quote.product.name}`,
      html: `
        <p>Dear ${quote.customer.firstName},</p>
        <p>AfriGlobal Insurance Brokers has reviewed your quote request for <strong>${quote.product.name}</strong>.</p>
        <p><strong>Proposed premium: ₦${dto.quoteAmount.toLocaleString()}/year</strong></p>
        ${dto.note ? `<p>Notes from AfriGlobal: ${dto.note}</p>` : ''}
        <p>Please log in to your dashboard to Accept, Counter, or Reject this quote. The quote expires in 7 days.</p>
      `,
    });

    if (quote.customer.phone) {
      await this.smsService.sendNotificationSms(
        quote.customer.phone,
        `AfriCover247: AfriGlobal has sent you a quote for ${quote.product.name} — ₦${dto.quoteAmount.toLocaleString()}/year. Log in to respond.`,
      );
    }

    this.logger.log(
      `Admin responded to quote ${quoteId} with amount ₦${dto.quoteAmount}`,
    );

    return updated;
  }

  // --- Customer: accept quote ---

  async acceptQuote(quoteId: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { customer: true, product: true },
    });

    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.customerId !== userId)
      throw new UnauthorizedException('Access denied');

    if (!['quote_sent', 'countered_by_admin'].includes(quote.status)) {
      throw new BadRequestException(
        'This quote cannot be accepted in its current state',
      );
    }

    if (quote.expiresAt && new Date() > quote.expiresAt) {
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: 'expired' },
      });
      throw new BadRequestException(
        'This quote has expired. Please request a new one.',
      );
    }

    const finalAmount = quote.adminQuoteAmount || quote.customerCounterAmount;

    if (!finalAmount) throw new BadRequestException('No quote amount to accept');

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'accepted',
        finalAmount,
        negotiationHistory: [
          ...((quote.negotiationHistory as object[]) || []),
          {
            actor: 'customer',
            actorId: userId,
            action: 'accepted',
            amount: finalAmount,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    const application = await this.prisma.application.create({
      data: {
        userId,
        productId: quote.productId,
        status: 'pending_payment',
        stepCompleted: 4,
        formData: {
          ...(quote.customerDetails as object),
          quoteId,
          quotedPremium: Number(finalAmount),
          fromQuote: true,
        },
        assetDetails: quote.customerDetails as Prisma.InputJsonValue,
      },
    });

    await this.prisma.payment.create({
      data: {
        applicationId: application.id,
        amount: finalAmount,
        currency: 'NGN',
        status: 'pending',
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        message: `You have accepted the quote for ${quote.product.name}. Proceed to payment to receive your policy.`,
        type: 'quote_accepted',
        referenceType: 'quote',
        referenceId: quoteId,
        quoteId,
      },
    });

    await this.emailService.sendEmail({
      to: quote.customer.email,
      subject: `Quote accepted — ${quote.product.name}`,
      html: `
        <p>Dear ${quote.customer.firstName},</p>
        <p>You have accepted the quote for <strong>${quote.product.name}</strong>.</p>
        <p><strong>Premium: ₦${Number(finalAmount).toLocaleString()}/year</strong></p>
        <p>Please proceed to payment to receive your policy certificate.</p>
      `,
    });

    this.logger.log(
      `Quote ${quoteId} accepted — application ${application.id} created`,
    );

    return {
      message: 'Quote accepted',
      applicationId: application.id,
      amount: Number(finalAmount),
      quoteId,
    };
  }

  // --- Customer: reject quote ---

  async rejectQuote(quoteId: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { product: true },
    });

    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.customerId !== userId)
      throw new UnauthorizedException('Access denied');

    if (!['quote_sent', 'countered_by_admin'].includes(quote.status)) {
      throw new BadRequestException(
        'This quote cannot be rejected in its current state',
      );
    }

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'rejected',
        negotiationHistory: [
          ...((quote.negotiationHistory as object[]) || []),
          {
            actor: 'customer',
            actorId: userId,
            action: 'rejected',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    });

    if (admins.length > 0) {
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          message: `Customer has declined the quote for ${quote.product.name}.`,
          type: 'quote_rejected',
          referenceType: 'quote',
          referenceId: quoteId,
          quoteId,
        })),
      });
    }

    this.logger.log(`Quote ${quoteId} rejected by customer ${userId}`);

    return { message: 'Quote rejected' };
  }

  // --- Customer: counter quote ---

  async customerCounterQuote(
    quoteId: string,
    userId: string,
    dto: CounterQuoteDto,
  ) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { customer: true, product: true },
    });

    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.customerId !== userId)
      throw new UnauthorizedException('Access denied');

    if (!['quote_sent', 'countered_by_admin'].includes(quote.status)) {
      throw new BadRequestException(
        'This quote cannot be countered in its current state',
      );
    }

    if (quote.roundsUsed >= MAX_ROUNDS) {
      throw new BadRequestException(
        'Maximum negotiation rounds reached. You must Accept or Reject this quote.',
      );
    }

    if (quote.expiresAt && new Date() > quote.expiresAt) {
      await this.prisma.quote.update({
        where: { id: quoteId },
        data: { status: 'expired' },
      });
      throw new BadRequestException('This quote has expired.');
    }

    const updatedHistory = [
      ...((quote.negotiationHistory as object[]) || []),
      {
        actor: 'customer',
        actorId: userId,
        action: 'countered',
        amount: dto.counterAmount,
        note: dto.note || null,
        timestamp: new Date().toISOString(),
      },
    ];

    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'countered_by_customer',
        customerCounterAmount: dto.counterAmount,
        customerNote: dto.note || null,
        negotiationHistory: updatedHistory,
        roundsUsed: { increment: 1 },
      },
    });

    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
      select: { id: true },
    });

    if (admins.length > 0) {
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          message: `Customer has countered the quote for ${quote.product.name}. Counter amount: ₦${dto.counterAmount.toLocaleString()}.`,
          type: 'quote_countered',
          referenceType: 'quote',
          referenceId: quoteId,
          quoteId,
        })),
      });
    }

    this.logger.log(
      `Quote ${quoteId} countered by customer — amount: ₦${dto.counterAmount}`,
    );

    return updated;
  }

  // --- Admin: counter customer counter ---

  async adminCounterQuote(
    quoteId: string,
    adminId: string,
    dto: CounterQuoteDto,
  ) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { customer: true, product: true },
    });

    if (!quote) throw new NotFoundException('Quote not found');

    if (quote.status !== 'countered_by_customer') {
      throw new BadRequestException('No customer counter to respond to');
    }

    if (quote.roundsUsed >= MAX_ROUNDS) {
      throw new BadRequestException('Maximum negotiation rounds reached.');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + QUOTE_EXPIRY_DAYS);

    const updatedHistory = [
      ...((quote.negotiationHistory as object[]) || []),
      {
        actor: 'admin',
        actorId: adminId,
        action: 'countered',
        amount: dto.counterAmount,
        note: dto.note || null,
        timestamp: new Date().toISOString(),
      },
    ];

    const updated = await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'countered_by_admin',
        adminQuoteAmount: dto.counterAmount,
        adminNote: dto.note || null,
        negotiationHistory: updatedHistory,
        roundsUsed: { increment: 1 },
        expiresAt,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: quote.customerId,
        message: `AfriGlobal has countered your offer for ${quote.product.name} with ₦${dto.counterAmount.toLocaleString()}. Please respond within 7 days.`,
        type: 'quote_countered',
        referenceType: 'quote',
        referenceId: quoteId,
        quoteId,
      },
    });

    await this.sendPushNotification(
      quote.customerId,
      'Counter-Offer — AfriCover247',
      `AfriGlobal countered your offer for ${quote.product.name}. ₦${dto.counterAmount.toLocaleString()}/year`,
      { referenceType: 'quote', referenceId: quoteId, type: 'quote_countered' },
    );

    await this.emailService.sendEmail({
      to: quote.customer.email,
      subject: `Counter-offer — ${quote.product.name}`,
      html: `
        <p>Dear ${quote.customer.firstName},</p>
        <p>AfriGlobal has responded to your counter-offer for <strong>${quote.product.name}</strong>.</p>
        <p><strong>New proposed premium: ₦${dto.counterAmount.toLocaleString()}/year</strong></p>
        ${dto.note ? `<p>Notes: ${dto.note}</p>` : ''}
        <p>Rounds remaining: ${MAX_ROUNDS - (quote.roundsUsed + 1)}</p>
        <p>Please log in to Accept, Counter, or Reject. This offer expires in 7 days.</p>
      `,
    });

    if (quote.customer.phone) {
      await this.smsService.sendNotificationSms(
        quote.customer.phone,
        `AfriCover247: AfriGlobal countered your offer for ${quote.product.name} — ₦${dto.counterAmount.toLocaleString()}/year. Log in to respond.`,
      );
    }

    this.logger.log(
      `Admin countered quote ${quoteId} — amount: ₦${dto.counterAmount}`,
    );

    return updated;
  }

  // --- Admin: accept customer counter ---

  async adminAcceptCounter(quoteId: string, adminId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { customer: true, product: true },
    });

    if (!quote) throw new NotFoundException('Quote not found');

    if (quote.status !== 'countered_by_customer') {
      throw new BadRequestException('No customer counter to accept');
    }

    if (!quote.customerCounterAmount) {
      throw new BadRequestException('No counter amount found');
    }

    const finalAmount = quote.customerCounterAmount;

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'accepted',
        finalAmount,
        adminQuoteAmount: finalAmount,
        negotiationHistory: [
          ...((quote.negotiationHistory as object[]) || []),
          {
            actor: 'admin',
            actorId: adminId,
            action: 'accepted_counter',
            amount: finalAmount,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    const application = await this.prisma.application.create({
      data: {
        userId: quote.customerId,
        productId: quote.productId,
        status: 'pending_payment',
        stepCompleted: 4,
        formData: {
          ...(quote.customerDetails as object),
          quoteId,
          quotedPremium: Number(finalAmount),
          fromQuote: true,
        },
        assetDetails: quote.customerDetails as Prisma.InputJsonValue,
      },
    });

    await this.prisma.payment.create({
      data: {
        applicationId: application.id,
        amount: finalAmount,
        currency: 'NGN',
        status: 'pending',
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: quote.customerId,
        message: `AfriGlobal has accepted your counter-offer for ${quote.product.name}. Proceed to payment to receive your policy.`,
        type: 'quote_accepted',
        referenceType: 'quote',
        referenceId: quoteId,
        quoteId,
      },
    });

    await this.sendPushNotification(
      quote.customerId,
      'Quote Accepted — AfriCover247',
      `AfriGlobal accepted your counter-offer for ${quote.product.name}. Proceed to payment.`,
      { referenceType: 'quote', referenceId: quoteId, type: 'quote_accepted' },
    );

    await this.emailService.sendEmail({
      to: quote.customer.email,
      subject: `Counter-offer accepted — ${quote.product.name}`,
      html: `
        <p>Dear ${quote.customer.firstName},</p>
        <p>AfriGlobal has accepted your counter-offer for <strong>${quote.product.name}</strong>.</p>
        <p><strong>Agreed premium: ₦${Number(finalAmount).toLocaleString()}/year</strong></p>
        <p>Please proceed to payment to receive your policy certificate.</p>
      `,
    });

    this.logger.log(
      `Admin accepted counter for quote ${quoteId} — application ${application.id} created`,
    );

    return {
      message: 'Counter-offer accepted',
      applicationId: application.id,
      amount: Number(finalAmount),
      quoteId,
    };
  }

  // --- Admin: reject quote entirely ---

  async adminRejectQuote(quoteId: string, adminId: string, reason?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { customer: true, product: true },
    });

    if (!quote) throw new NotFoundException('Quote not found');

    if (!['pending_review', 'countered_by_customer'].includes(quote.status)) {
      throw new BadRequestException(
        'This quote cannot be rejected in its current state',
      );
    }

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'rejected',
        negotiationHistory: [
          ...((quote.negotiationHistory as object[]) || []),
          {
            actor: 'admin',
            actorId: adminId,
            action: 'rejected',
            note: reason || null,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: quote.customerId,
        message: `Your quote request for ${quote.product.name} could not be accommodated at this time.${reason ? ` Reason: ${reason}` : ''}`,
        type: 'quote_rejected',
        referenceType: 'quote',
        referenceId: quoteId,
        quoteId,
      },
    });

    await this.emailService.sendEmail({
      to: quote.customer.email,
      subject: `Quote update — ${quote.product.name}`,
      html: `
        <p>Dear ${quote.customer.firstName},</p>
        <p>We regret to inform you that your quote request for <strong>${quote.product.name}</strong> could not be accommodated at this time.</p>
        ${reason ? `<p>Reason: ${reason}</p>` : ''}
        <p>Please contact AfriGlobal directly if you have questions.</p>
      `,
    });

    this.logger.log(`Admin rejected quote ${quoteId}`);

    return { message: 'Quote rejected' };
  }

  // --- Admin: get all quotes ---

  async adminGetAllQuotes(filters: { status?: string }) {
    return this.prisma.quote.findMany({
      where: filters.status ? { status: filters.status as any } : {},
      include: {
        product: { select: { id: true, name: true, category: true } },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
