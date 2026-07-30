import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { StorageService } from '../storage/storage.service';
import { ApplicationsService } from '../applications/applications.service';

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
    private storageService: StorageService,
    private applicationsService: ApplicationsService,
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

  // --- Generate policy number ---

  private generatePolicyNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `AFC-${year}-${random}`;
  }

  // --- Generate policy PDF buffer ---

  private generatePdfBuffer(data: {
    policyNumber: string;
    issueDate: Date;
    startDate: Date;
    expiryDate: Date;
    premiumPaid: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    productName: string;
    productCategory: string;
    coverageHighlights: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(20).font('Helvetica-Bold').text('AfriCover247', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Digital Insurance Portal', { align: 'center' });
      doc.fontSize(10).text('Powered by AfriGlobal Insurance Brokers Limited', { align: 'center' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(16).font('Helvetica-Bold').text('INSURANCE POLICY CERTIFICATE');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');
      doc.text(`Policy Number: ${data.policyNumber}`);
      doc.text(`Issue Date: ${data.issueDate.toLocaleDateString('en-NG')}`);
      doc.text(`Start Date: ${data.startDate.toLocaleDateString('en-NG')}`);
      doc.text(`Expiry Date: ${data.expiryDate.toLocaleDateString('en-NG')}`);
      doc.text(`Premium Paid: ₦${Number(data.premiumPaid).toLocaleString()}`);
      doc.moveDown();

      doc.fontSize(13).font('Helvetica-Bold').text('Policyholder Details');
      doc.fontSize(11).font('Helvetica');
      doc.text(`Name: ${data.customerName}`);
      doc.text(`Email: ${data.customerEmail}`);
      doc.text(`Phone: ${data.customerPhone}`);
      doc.moveDown();

      doc.fontSize(13).font('Helvetica-Bold').text('Product Details');
      doc.fontSize(11).font('Helvetica');
      doc.text(`Product: ${data.productName}`);
      doc.text(`Category: ${data.productCategory}`);
      doc.moveDown();

      doc.fontSize(13).font('Helvetica-Bold').text('Coverage Highlights');
      doc.fontSize(11).font('Helvetica');
      const highlights = data.coverageHighlights.split('\n');
      highlights.forEach((item) => {
        if (item.trim()) doc.text(`• ${item.trim()}`);
      });
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica');
      doc.text(
        'This policy is issued subject to the terms and conditions of AfriGlobal Insurance Brokers Limited. ' +
          'RC 104345. Plot 141C, Oshodi/Gbagada Expressway, Anthony, Lagos.',
        { align: 'center' },
      );

      doc.end();
    });
  }

  // --- Generate and issue policy ---

  async generatePolicy(applicationId: string): Promise<void> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
        product: true,
      },
    });

    if (!application) {
      this.logger.error(
        `Application ${applicationId} not found for policy generation`,
      );
      return;
    }

    const existingPolicy = await this.prisma.policy.findUnique({
      where: { applicationId },
    });

    if (existingPolicy) {
      this.logger.log(
        `Policy already exists for application ${applicationId} — skipping`,
      );
      return;
    }

    const policyNumber = this.generatePolicyNumber();
    const issueDate = new Date();
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + application.product.durationMonths);

    if (application.product.premiumAmount == null) {
      this.logger.error(
        `Application ${applicationId} product has no premium amount for policy generation`,
      );
      return;
    }

    const premiumAmount = application.product.premiumAmount;

    const pdfBuffer = await this.generatePdfBuffer({
      policyNumber,
      issueDate,
      startDate,
      expiryDate,
      premiumPaid: Number(premiumAmount),
      customerName: `${application.user.firstName} ${application.user.lastName}`,
      customerEmail: application.user.email,
      customerPhone: application.user.phone || '',
      productName: application.product.name,
      productCategory: application.product.category,
      coverageHighlights: application.product.coverageHighlights,
    });

    let policyPdfUrl = '';
    try {
      policyPdfUrl = await this.storageService.uploadPdf(
        pdfBuffer,
        `${policyNumber}.pdf`,
      );
    } catch (error) {
      this.logger.error(`Failed to upload policy PDF to S3`, error);
    }

    const policy = await this.prisma.policy.create({
      data: {
        applicationId,
        userId: application.userId,
        productId: application.productId,
        policyNumber,
        issueDate,
        startDate,
        expiryDate,
        premiumPaid: premiumAmount,
        policyPdfUrl,
        status: 'active',
      },
    });

    await this.prisma.application.update({
      where: { id: applicationId },
      data: { status: 'issued' },
    });

    await this.applicationsService.clearDraft(applicationId);

    await this.prisma.notification.create({
      data: {
        userId: application.userId,
        message: `Your policy ${policyNumber} has been issued. Check your email for the policy document.`,
        type: 'policy_issued',
        referenceType: 'policy',
        referenceId: policy.id,
      },
    });

    await this.emailService.sendPolicyIssuedEmail(
      application.user.email,
      application.user.firstName,
      policyNumber,
      application.product.name,
      policyPdfUrl || null,
    );

    await this.sendPushNotification(
      application.userId,
      'Policy Issued — AfriCover247',
      `Your policy ${policy.policyNumber} is ready. Check your email for the certificate.`,
      { referenceType: 'policy', referenceId: policy.id, type: 'policy_issued' },
    );

    if (application.user.phone) {
      await this.smsService.sendPolicyIssuedSms(
        application.user.phone,
        policyNumber,
      );
    }

    this.logger.log(
      `Policy ${policyNumber} issued for application ${applicationId}`,
    );
  }

  // --- List customer policies ---

  findMyPolicies(userId: string) {
    return this.prisma.policy.findMany({
      where: { userId },
      include: {
        product: {
          select: { name: true, category: true, coverageHighlights: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Get single policy ---

  async findOne(id: string, userId: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        product: true,
        application: {
          include: { kycDocuments: true },
        },
        claims: {
          select: {
            id: true,
            claimReference: true,
            claimType: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!policy) throw new NotFoundException('Policy not found');
    if (policy.userId !== userId)
      throw new ForbiddenException('You do not have access to this policy');
    return policy;
  }

  // --- Admin: list all policies ---

  findAll(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PolicyWhereInput = {};
    if (filters.status) where.status = filters.status as Prisma.EnumPolicyStatusFilter['equals'];
    if (filters.search) {
      where.OR = [
        { policyNumber: { contains: filters.search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    return this.prisma.policy.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { name: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  // --- Admin: get single policy ---

  async findOneAdmin(id: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        product: true,
        application: { include: { kycDocuments: true } },
        claims: true,
      },
    });
    if (!policy) throw new NotFoundException('Policy not found');
    return policy;
  }

  async cancelPolicy(policyId: string) {
    const policy = await this.prisma.policy.findUnique({
      where: { id: policyId },
      include: { user: true, product: true },
    });

    if (!policy) throw new NotFoundException('Policy not found');
    if (policy.status !== 'active') {
      throw new BadRequestException('Only active policies can be cancelled');
    }

    await this.prisma.policy.update({
      where: { id: policyId },
      data: { status: 'cancelled' },
    });

    await this.prisma.notification.create({
      data: {
        userId: policy.userId,
        message: `Your policy ${policy.policyNumber} has been cancelled. Please contact AfriGlobal for more information.`,
        type: 'policy_cancelled',
        referenceType: 'policy',
        referenceId: policyId,
      },
    });

    this.logger.log(`Policy ${policy.policyNumber} cancelled by admin`);

    return { cancelled: true, policyNumber: policy.policyNumber };
  }
}
