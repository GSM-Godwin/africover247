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
import { AdminService } from '../admin/admin.service';

@Injectable()
export class PoliciesService {
  private readonly logger = new Logger(PoliciesService.name);

  constructor(
    private prisma: PrismaService,
    private readonly adminService: AdminService,
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
    policyNumber: string
    issueDate: Date
    startDate: Date
    expiryDate: Date
    premiumPaid: number
    customerName: string
    customerEmail: string
    customerPhone: string
    productName: string
    productCategory: string
    coverageHighlights: string
    exclusions: string
    paymentRef: string
    underwriter: string
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 0, size: 'A4' })
      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
  
      const W = doc.page.width
      const H = doc.page.height
      const MIDNIGHT = '#0d1b2e'
      const PRIMARY = '#15679b'
      const DAYBREAK = '#F68B1E'
      const SLATE = '#5C6478'
      const PAPER = '#F7F8FA'
      const BORDER = '#E2E8F0'
      const SUCCESS = '#2E7D32'
      const LIGHT_BLU = '#EBF4FA'
  
      // --- Header bar ---
      doc.rect(0, 0, W, 120).fill(MIDNIGHT)
      doc.fontSize(22).font('Helvetica-Bold').fillColor('white')
      doc.text('AfriCover247', 40, 24)
      doc.fontSize(9).font('Helvetica').fillColor('#A8C4D8')
      doc.text('by AfriGlobal Insurance Brokers Limited', 40, 50)
      doc.roundedRect(W - 180, 28, 140, 22, 4).fill(PRIMARY)
      doc.fontSize(8).font('Helvetica-Bold').fillColor('white')
      doc.text('NAICOM Licensed Broker', W - 175, 35, { width: 130, align: 'center' })
      doc.fontSize(13).font('Helvetica-Bold').fillColor(DAYBREAK)
      doc.text('CERTIFICATE OF INSURANCE', 40, 72)
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#A8C4D8')
      doc.text(`Policy No: ${data.policyNumber}`, W - 230, 72, { width: 190, align: 'right' })
      doc.roundedRect(40, 90, 55, 18, 3).fill(SUCCESS)
      doc.fontSize(7).font('Helvetica-Bold').fillColor('white')
      doc.text('ACTIVE', 40, 96, { width: 55, align: 'center' })
      doc.fontSize(8).font('Helvetica').fillColor('#A8C4D8')
      doc.text(`Issued: ${data.issueDate.toLocaleDateString('en-NG')}`, 102, 96)
  
      // --- Product banner ---
      doc.rect(0, 120, W, 36).fill(LIGHT_BLU)
      doc.fontSize(12).font('Helvetica-Bold').fillColor(PRIMARY)
      doc.text(data.productName, 0, 131, { width: W, align: 'center' })
  
      // --- Insured details ---
      let y = 174
      doc.roundedRect(30, y - 10, W - 60, 110, 4).fillAndStroke(PAPER, BORDER)
      doc.fontSize(8).font('Helvetica-Bold').fillColor(PRIMARY)
      doc.text('INSURED DETAILS', 40, y)
      doc.moveTo(30, y + 14).lineTo(W - 30, y + 14).stroke(BORDER)
      y += 22
  
      const leftX = 40
      const rightX = W / 2 + 10
      const rowH = 20
  
      const insuredLeft = [
        ['Full Name', data.customerName],
        ['Email Address', data.customerEmail],
        ['Phone Number', data.customerPhone || '—'],
      ]
      const insuredRight = [
        ['Category', data.productCategory],
        ['Nationality', 'Nigerian'],
        ['Policy Type', 'Individual'],
      ]
  
      insuredLeft.forEach(([label, value], i) => {
        const ry = y + i * rowH
        doc.fontSize(7).font('Helvetica').fillColor(SLATE).text(label, leftX, ry)
        doc.fontSize(8).font('Helvetica-Bold').fillColor(MIDNIGHT).text(value, leftX, ry + 8)
      })
      insuredRight.forEach(([label, value], i) => {
        const ry = y + i * rowH
        doc.fontSize(7).font('Helvetica').fillColor(SLATE).text(label, rightX, ry)
        doc.fontSize(8).font('Helvetica-Bold').fillColor(MIDNIGHT).text(value, rightX, ry + 8)
      })
  
      // --- Policy details ---
      y = 300
      doc.roundedRect(30, y - 10, W - 60, 140, 4).fillAndStroke(PAPER, BORDER)
      doc.fontSize(8).font('Helvetica-Bold').fillColor(PRIMARY)
      doc.text('POLICY DETAILS', 40, y)
      doc.moveTo(30, y + 14).lineTo(W - 30, y + 14).stroke(BORDER)
      y += 22
  
      const policyFields: [string, string, string, string][] = [
        ['Effective Date', data.startDate.toLocaleDateString('en-NG'), 'Expiry Date', data.expiryDate.toLocaleDateString('en-NG')],
        ['Cover Type', data.productCategory, 'Policy Period', '12 months'],
        ['Premium Paid', `NGN ${Number(data.premiumPaid).toLocaleString('en-NG')}`, 'Payment Ref', data.paymentRef || '—'],
        ['Underwriter', data.underwriter, 'Issue Date', data.issueDate.toLocaleDateString('en-NG')],
      ]
  
      policyFields.forEach(([l1, v1, l2, v2]) => {
        doc.fontSize(7).font('Helvetica').fillColor(SLATE)
        doc.text(l1, leftX, y)
        doc.text(l2, rightX, y)
        doc.fontSize(8).font('Helvetica-Bold').fillColor(MIDNIGHT)
        doc.text(v1, leftX, y + 8)
        doc.text(v2, rightX, y + 8)
        y += 22
      })
  
      // --- Coverage & Exclusions ---
      y = 460
      const colW = (W - 70) / 2
  
      doc.roundedRect(30, y - 10, colW, 110, 4).fillAndStroke(PAPER, BORDER)
      doc.fontSize(8).font('Helvetica-Bold').fillColor(PRIMARY)
      doc.text('COVERAGE HIGHLIGHTS', 40, y)
      doc.moveTo(30, y + 14).lineTo(30 + colW, y + 14).stroke(BORDER)
      y += 22
      const coverItems = data.coverageHighlights.split('\n').filter(Boolean).slice(0, 5)
      coverItems.forEach((item) => {
        doc.circle(40, y + 4, 3).fill(SUCCESS)
        doc.fontSize(7.5).font('Helvetica').fillColor(MIDNIGHT)
        doc.text(item.trim(), 48, y, { width: colW - 25 })
        y += 16
      })
  
      y = 460
      const exX = 40 + colW + 10
      doc.roundedRect(exX - 10, y - 10, colW, 110, 4).fillAndStroke(PAPER, BORDER)
      doc.fontSize(8).font('Helvetica-Bold').fillColor(PRIMARY)
      doc.text('EXCLUSIONS', exX, y)
      doc.moveTo(exX - 10, y + 14).lineTo(exX - 10 + colW, y + 14).stroke(BORDER)
      y += 22
      const exItems = data.exclusions.split('\n').filter(Boolean).slice(0, 5)
      exItems.forEach((item) => {
        doc.circle(exX, y + 4, 3).fill('#C62828')
        doc.fontSize(7.5).font('Helvetica').fillColor(MIDNIGHT)
        doc.text(item.trim(), exX + 8, y, { width: colW - 25 })
        y += 16
      })
  
      // --- Declaration ---
      y = 582
      doc.roundedRect(30, y - 8, W - 60, 48, 4).fillAndStroke(LIGHT_BLU, PRIMARY)
      doc.fontSize(7).font('Helvetica').fillColor(MIDNIGHT)
      doc.text(
        'This certificate confirms that the insured named above holds a valid insurance policy issued by AfriGlobal Insurance Brokers ' +
        'Limited, a NAICOM-licensed insurance broker. This document serves as evidence of cover for the period stated. ' +
        'Claims must be reported within 30 days of occurrence. Subject to full policy terms and conditions.',
        40, y,
        { width: W - 80, align: 'justify' }
      )
  
      // --- Signatures ---
      y = 646
      const sigW = (W - 80) / 3
      const sigNames: [string, string][] = [
        ['Casmir C. Azubuike', 'Managing Director / CEO'],
        ['Solomon Egbeleye', 'Executive Director'],
        ['Authorised Signatory', 'Underwriter Representative'],
      ]
      sigNames.forEach(([name, title], i) => {
        const sx = 30 + i * (sigW + 10)
        doc.moveTo(sx, y).lineTo(sx + sigW - 10, y).stroke(MIDNIGHT)
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(MIDNIGHT)
        doc.text(name, sx, y + 4)
        doc.fontSize(7).font('Helvetica').fillColor(SLATE)
        doc.text(title, sx, y + 14)
      })
  
      doc.circle(W - 50, y + 10, 24).fillAndStroke(PAPER, MIDNIGHT)
      doc.fontSize(6).font('Helvetica-Bold').fillColor(MIDNIGHT)
      doc.text('COMPANY', W - 74, y + 3, { width: 48, align: 'center' })
      doc.text('SEAL', W - 74, y + 11, { width: 48, align: 'center' })
  
      // --- Footer ---
      doc.rect(0, H - 50, W, 50).fill(MIDNIGHT)
      doc.fontSize(8).font('Helvetica-Bold').fillColor('white')
      doc.text('AfriGlobal Insurance Brokers Limited', 30, H - 40)
      doc.fontSize(7).font('Helvetica').fillColor('#A8C4D8')
      doc.text('141c Oshodi/Gbagada Expressway, Anthony, Lagos, Nigeria', 30, H - 28)
      doc.text('Tel: 08101315330 / 09063675032  |  info@afriglobal.com.ng  |  www.africover247.com.ng', 30, H - 18)
      doc.fontSize(7).font('Helvetica').fillColor('#8BA8BC')
      doc.text(`Cert: ${data.policyNumber}`, W - 180, H - 28, { width: 150, align: 'right' })
      doc.text('NAICOM Licensed Broker', W - 180, H - 18, { width: 150, align: 'right' })
  
      // --- Watermark ---
      doc.save()
      doc.translate(W / 2, H / 2)
      doc.rotate(45)
      doc.fontSize(64).font('Helvetica-Bold').fillColor(PRIMARY).fillOpacity(0.04)
      doc.text('AFRICOVER247', -150, -30)
      doc.restore()
  
      doc.end()
    })
  }

  // --- Generate and issue policy ---

  async generatePolicy(applicationId: string): Promise<void> {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
        product: true,
        payments: {
          where: { status: 'successful' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })
    const payment = application?.payments?.[0] ?? null

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

    const formData = application.formData as Record<string, any> | null;
    const calculatedPremium = formData?.calculatedPremium
      ? Number(formData.calculatedPremium)
      : formData?.quotedPremium
      ? Number(formData.quotedPremium)
      : null;

    const premiumAmount = application.product.premiumAmount != null
      ? Number(application.product.premiumAmount)
      : calculatedPremium;

    if (!premiumAmount) {
      this.logger.error(
        `Application ${applicationId} has no premium amount for policy generation — product: ${application.product.name}`,
      );
      return;
    }

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
      exclusions: application.product.exclusions || '',
      paymentRef: payment?.gatewayReference || '',
      underwriter: 'AfriGlobal Insurance Brokers Limited',
    })

    let policyPdfUrl = '';
    try {
      const safeFilename = `${policyNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`;
      policyPdfUrl = await this.storageService.uploadPdf(pdfBuffer, safeFilename);
    } catch (error) {
      this.logger.error(`Failed to upload policy PDF`, error);
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

    await this.adminService.createAuditLog({
      actorId: application.userId,
      action: 'POLICY_ISSUED',
      entityType: 'Policy',
      entityId: policy.id,
      details: {
        policyNumber: policy.policyNumber,
        productName: application.product.name,
        premiumPaid: Number(premiumAmount),
      },
    });
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

  async snoozeRenewalReminder(policyId: string, userId: string, until: Date) {
    const policy = await this.prisma.policy.findUnique({ where: { id: policyId } });
    if (!policy) throw new NotFoundException('Policy not found');
    if (policy.userId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.policy.update({
      where: { id: policyId },
      data: { remindersSupressed: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { reminderSnoozedUntil: until },
    });

    return { snoozedUntil: until };
  }

  async unsnoozePolicies() {
    const now = new Date();
    await this.prisma.user.updateMany({
      where: {
        reminderSnoozedUntil: { lte: now },
      },
      data: { reminderSnoozedUntil: null },
    });

    const users = await this.prisma.user.findMany({
      where: { reminderSnoozedUntil: null },
      select: { id: true },
    });

    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) return;

    await this.prisma.policy.updateMany({
      where: {
        userId: { in: userIds },
        remindersSupressed: true,
        status: { in: ['active', 'renewal_due'] as any },
      },
      data: { remindersSupressed: false },
    });
  }

  async getRenewalsForAdmin(days: number) {
    const now = new Date();

    if (days === -1) {
      return this.prisma.policy.findMany({
        where: { status: 'expired' as any },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          product: { select: { name: true, category: true } },
        },
        orderBy: { expiryDate: 'desc' },
        take: 100,
      });
    }

    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);

    return this.prisma.policy.findMany({
      where: {
        status: { in: ['active', 'renewal_due'] as any },
        expiryDate: { lte: targetDate, gte: now },
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        product: { select: { name: true, category: true } },
      },
      orderBy: { expiryDate: 'asc' },
      take: 100,
    });
  }

  async getRenewalStats() {
    const now = new Date();

    function futureDate(days: number) {
      const d = new Date(now);
      d.setDate(d.getDate() + days);
      return d;
    }

    const [d7, d14, d30, d60, d90, expired, total] = await Promise.all([
      this.prisma.policy.count({ where: { status: { in: ['active', 'renewal_due'] as any }, expiryDate: { lte: futureDate(7), gte: now } } }),
      this.prisma.policy.count({ where: { status: { in: ['active', 'renewal_due'] as any }, expiryDate: { lte: futureDate(14), gte: now } } }),
      this.prisma.policy.count({ where: { status: { in: ['active', 'renewal_due'] as any }, expiryDate: { lte: futureDate(30), gte: now } } }),
      this.prisma.policy.count({ where: { status: { in: ['active', 'renewal_due'] as any }, expiryDate: { lte: futureDate(60), gte: now } } }),
      this.prisma.policy.count({ where: { status: { in: ['active', 'renewal_due'] as any }, expiryDate: { lte: futureDate(90), gte: now } } }),
      this.prisma.policy.count({ where: { status: 'expired' as any } }),
      this.prisma.policy.count({ where: { status: 'active' as any } }),
    ]);

    return {
      dueSoon7: d7,
      dueSoon14: d14,
      dueSoon30: d30,
      dueSoon60: d60,
      dueSoon90: d90,
      expired,
      totalActive: total,
    };
  }
}
