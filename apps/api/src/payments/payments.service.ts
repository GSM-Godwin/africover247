import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MonnifyService } from './monnify.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PoliciesService } from '../policies/policies.service';
import { ApplicationsService } from '../applications/applications.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private monnifyService: MonnifyService,
    private configService: ConfigService,
    private policiesService: PoliciesService,
    private applicationsService: ApplicationsService,
  ) {}

  // --- Initiate payment ---

  async initiatePayment(userId: string, dto: InitiatePaymentDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
      include: {
        user: true,
        product: true,
      },
    });

    // TODO: remove after debugging
    this.logger.log(
      `DEBUG application: ${JSON.stringify({ id: application?.id, status: application?.status, userId: application?.userId })}`,
    );

    if (!application) throw new NotFoundException('Application not found');
    if (application.userId !== userId)
      throw new UnauthorizedException(
        'You do not have access to this application',
      );

    if (!['draft', 'pending_payment'].includes(application.status)) {
      this.logger.log(
        `DEBUG: failing on status check — status is: "${application.status}"`,
      );
      throw new BadRequestException(
        'This application has already been paid or is not eligible for payment',
      );
    }

    const existingPayment = await this.prisma.payment.findFirst({
      where: { applicationId: dto.applicationId, status: 'successful' },
    });
    this.logger.log(`DEBUG existingPayment: ${JSON.stringify(existingPayment)}`);
    if (existingPayment) {
      this.logger.log(`DEBUG: failing on existing payment check`);
      throw new BadRequestException('This application has already been paid');
    }

    // --- Reuse existing pending payment or create new ---
    let payment = await this.prisma.payment.findFirst({
      where: { applicationId: dto.applicationId, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    if (application.product.premiumAmount == null) {
      throw new BadRequestException(
        'This product requires a calculated or quoted premium before payment',
      );
    }

    const premiumAmount = application.product.premiumAmount;

    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          applicationId: dto.applicationId,
          amount: premiumAmount,
          currency: 'NGN',
          status: 'pending',
        },
      });
    }

    // --- Generate fresh Monnify reference for this attempt ---
    const monnifyReference = `${payment.id}-${Date.now()}`;

    const callbackUrl =
      this.configService.get<string>('PAYMENT_CALLBACK_URL') ||
      'http://localhost:3000/payment/callback';

    const { checkoutUrl } = await this.monnifyService.initializeTransaction({
      email: application.user.email,
      amount: Number(premiumAmount),
      reference: monnifyReference,
      name: `${application.user.firstName} ${application.user.lastName}`,
      callbackUrl,
      description: `${application.product.name} — AfriCover247`,
    });

    await this.prisma.application.update({
      where: { id: dto.applicationId },
      data: { status: 'pending_payment' },
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayReference: monnifyReference },
    });

    return {
      checkoutUrl,
      paymentId: payment.id,
      monnifyReference,
      amount: premiumAmount,
      currency: 'NGN',
    };
  }

  private extractPaymentIdFromMonnifyReference(monnifyReference: string): string {
    return monnifyReference.includes('-')
      ? monnifyReference.split('-').slice(0, 5).join('-')
      : monnifyReference;
  }

  // --- Handle Monnify webhook ---

  async handleWebhook(rawBody: string, signature: string) {
    const isValid = this.monnifyService.verifyWebhookSignature(
      rawBody,
      signature,
    );
    if (!isValid) throw new UnauthorizedException('Invalid webhook signature');

    const payload = JSON.parse(rawBody);

    const eventType = payload.eventType || payload.event;
    const eventData = payload.eventData || payload.data;

    if (eventType === 'SUCCESSFUL_TRANSACTION') {
      await this.handleSuccessfulCharge(eventData);
    }

    if (eventType === 'FAILED_TRANSACTION') {
      await this.handleFailedCharge(eventData);
    }

    return { received: true };
  }

  // --- Handle successful charge ---

  private async handleSuccessfulCharge(data: Record<string, unknown>) {
    const monnifyReference = (data.paymentReference || data.reference) as string;

    const paymentId = monnifyReference.includes('-')
      ? monnifyReference.split('-').slice(0, 5).join('-')
      : monnifyReference;

    this.logger.log(
      `Processing successful payment — monnifyReference: ${monnifyReference}, paymentId: ${paymentId}`,
    );

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for reference: ${monnifyReference}`);
      return;
    }

    if (payment.status === 'successful') {
      this.logger.log(`Payment ${paymentId} already processed — skipping`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'successful',
        webhookReceivedAt: new Date(),
        gatewayResponse: data as Prisma.InputJsonValue,
      },
    });

    await this.prisma.application.update({
      where: { id: payment.applicationId },
      data: { status: 'paid' },
    });

    await this.applicationsService.clearDraft(payment.applicationId);

    this.logger.log(
      `Payment ${paymentId} processed — triggering policy generation`,
    );
    await this.policiesService.generatePolicy(payment.applicationId);
  }

  // --- Handle failed charge ---

  private async handleFailedCharge(data: Record<string, unknown>) {
    const monnifyReference = (data.paymentReference || data.reference) as string;
    const paymentId =
      this.extractPaymentIdFromMonnifyReference(monnifyReference);

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'failed',
        webhookReceivedAt: new Date(),
        gatewayResponse: data as Prisma.InputJsonValue,
      },
    });

    this.logger.log(
      `Payment ${paymentId} failed — application stays resumable`,
    );
  }

  // --- Get payment status ---

  async getPaymentStatus(applicationId: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');
    if (application.userId !== userId)
      throw new UnauthorizedException(
        'You do not have access to this application',
      );

    const payment = await this.prisma.payment.findFirst({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      applicationStatus: application.status,
      payment: payment || null,
    };
  }

  // --- Stub: simulate successful payment (dev only) ---

  async simulateSuccessfulPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    const stubWebhookPayload = JSON.stringify({
      eventType: 'SUCCESSFUL_TRANSACTION',
      eventData: {
        paymentReference: paymentId,
        amountPaid: Number(payment.amount),
        paymentStatus: 'PAID',
        stub: true,
      },
    });

    return this.handleWebhook(stubWebhookPayload, 'stub-signature');
  }
}
