import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './paystack.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PoliciesService } from '../policies/policies.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private paystackService: PaystackService,
    private configService: ConfigService,
    private policiesService: PoliciesService,
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

    if (!application) throw new NotFoundException('Application not found');
    if (application.userId !== userId)
      throw new UnauthorizedException(
        'You do not have access to this application',
      );

    const existingPayment = await this.prisma.payment.findFirst({
      where: { applicationId: dto.applicationId, status: 'successful' },
    });
    if (existingPayment)
      throw new BadRequestException('This application has already been paid');

    if (!['draft', 'pending_payment'].includes(application.status)) {
      throw new BadRequestException(
        'This application has already been paid or is not eligible for payment',
      );
    }

    const pendingPayment = await this.prisma.payment.findFirst({
      where: { applicationId: dto.applicationId, status: 'pending' },
    });
    if (pendingPayment) {
      throw new BadRequestException(
        'This application has already been paid or is not eligible for payment',
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        applicationId: dto.applicationId,
        amount: application.product.premiumAmount,
        currency: 'NGN',
        status: 'pending',
      },
    });

    const callbackUrl =
      this.configService.get<string>('PAYMENT_CALLBACK_URL') ||
      'http://localhost:3000/payment/callback';

    const { authorizationUrl } = await this.paystackService.initializeTransaction(
      {
        email: application.user.email,
        amount: Number(application.product.premiumAmount) * 100,
        reference: payment.id,
        callbackUrl,
        metadata: {
          applicationId: dto.applicationId,
          productName: application.product.name,
          userId,
        },
      },
    );

    await this.prisma.application.update({
      where: { id: dto.applicationId },
      data: { status: 'pending_payment' },
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayReference: payment.id },
    });

    return {
      checkoutUrl: authorizationUrl,
      paymentId: payment.id,
      amount: application.product.premiumAmount,
      currency: 'NGN',
    };
  }

  // --- Handle Paystack webhook ---

  async handleWebhook(rawBody: string, signature: string) {
    const isValid = this.paystackService.verifyWebhookSignature(
      rawBody,
      signature,
    );
    if (!isValid) throw new UnauthorizedException('Invalid webhook signature');

    const payload = JSON.parse(rawBody);

    if (payload.event === 'charge.success') {
      await this.handleSuccessfulCharge(payload.data);
    }

    if (payload.event === 'charge.failed') {
      await this.handleFailedCharge(payload.data);
    }

    return { received: true };
  }

  // --- Handle successful charge ---

  private async handleSuccessfulCharge(data: Record<string, unknown>) {
    const paymentId = data.reference as string;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for reference: ${paymentId}`);
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

    this.logger.log(
      `Payment ${paymentId} processed successfully — triggering policy generation`,
    );

    await this.policiesService.generatePolicy(payment.applicationId);
  }

  // --- Handle failed charge ---

  private async handleFailedCharge(data: Record<string, unknown>) {
    const paymentId = data.reference as string;

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
      event: 'charge.success',
      data: {
        reference: paymentId,
        amount: Number(payment.amount) * 100,
        status: 'success',
        stub: true,
      },
    });

    return this.handleWebhook(stubWebhookPayload, 'stub-signature');
  }
}
