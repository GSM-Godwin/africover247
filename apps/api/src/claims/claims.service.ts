import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ClaimStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../sms/sms.service';
import { AdminService } from '../admin/admin.service';
import { StorageService } from '../storage/storage.service';
import { CreateClaimDto } from './dto/create-claim.dto';
import { UpdateClaimStatusDto } from './dto/update-claim-status.dto';
import { AddCommentDto } from './dto/add-comment.dto';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private smsService: SmsService,
    private adminService: AdminService,
    private storageService: StorageService,
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

  // --- Generate claim reference ---

  private generateClaimReference(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `CLM-${year}-${random}`;
  }

  // --- Submit new claim ---

  async create(userId: string, dto: CreateClaimDto) {
    const policy = await this.prisma.policy.findUnique({
      where: { id: dto.policyId },
      include: { user: true },
    });

    if (!policy) throw new NotFoundException('Policy not found');
    if (policy.userId !== userId)
      throw new ForbiddenException('You do not have access to this policy');
    if (policy.status !== 'active')
      throw new BadRequestException(
        'You can only file claims against active policies',
      );

    const claimReference = this.generateClaimReference();

    const claim = await this.prisma.claim.create({
      data: {
        policyId: dto.policyId,
        userId,
        claimReference,
        claimType: dto.claimType,
        incidentDate: new Date(dto.incidentDate),
        incidentLocation: dto.incidentLocation,
        description: dto.description,
        estimatedAmount: dto.estimatedAmount,
        policeReportFiled: dto.policeReportFiled,
        policeReportNumber: dto.policeReportNumber,
        status: 'submitted',
      },
      include: { policy: { include: { product: true } } },
    });

    await this.prisma.claimStatusHistory.create({
      data: {
        claimId: claim.id,
        newStatus: 'submitted',
        changedBy: userId,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        message: `Your claim ${claimReference} has been submitted successfully.`,
        type: 'claim_submitted',
        referenceType: 'claim',
        referenceId: claim.id,
      },
    });

    await this.sendPushNotification(
      userId,
      'Claim Submitted — AfriCover247',
      `Your claim for ${policy.policyNumber} has been submitted successfully.`,
      { referenceType: 'claim', referenceId: claim.id, type: 'claim_submitted' },
    );

    await this.emailService.sendEmail({
      to: policy.user.email,
      subject: `Your claim ${claimReference} has been updated`,
      html: `<p>Your claim status has been updated to <strong>Submitted</strong>.</p>`,
    });

    return claim;
  }

  // --- List customer claims ---

  findMyClaims(userId: string) {
    return this.prisma.claim.findMany({
      where: { userId },
      include: {
        policy: {
          include: { product: { select: { name: true, category: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // --- Get single claim ---

  async findOne(id: string, userId: string) {
    const claim = await this.prisma.claim.findUnique({
      where: { id },
      include: {
        policy: { include: { product: true } },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        },
        documents: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        },
      },
    });

    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.userId !== userId)
      throw new ForbiddenException('You do not have access to this claim');
    return claim;
  }

  // --- Upload claim document ---

  async addDocument(
    claimId: string,
    userId: string,
    file: Express.Multer.File,
    documentType: string,
  ) {
    await this.findOne(claimId, userId);

    const { url } = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      'claims',
    );

    return this.prisma.claimDocument.create({
      data: {
        claimId,
        documentType,
        fileUrl: url,
        fileName: file.originalname,
      },
    });
  }

  // --- Add comment ---

  async addComment(
    claimId: string,
    userId: string,
    dto: AddCommentDto,
    isAdmin = false,
  ) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
    });
    if (!claim) throw new NotFoundException('Claim not found');

    if (!isAdmin && claim.userId !== userId) {
      throw new ForbiddenException('You do not have access to this claim');
    }

    return this.prisma.claimComment.create({
      data: {
        claimId,
        userId,
        comment: dto.comment,
      },
      include: {
        user: { select: { firstName: true, lastName: true, role: true } },
      },
    });
  }

  // --- Admin: update claim status ---

  async updateStatus(
    claimId: string,
    adminId: string,
    dto: UpdateClaimStatusDto,
  ) {
    const claim = await this.prisma.claim.findUnique({
      where: { id: claimId },
      include: { user: true },
    });

    if (!claim) throw new NotFoundException('Claim not found');

    const oldStatus = claim.status;

    const updated = await this.prisma.claim.update({
      where: { id: claimId },
      data: { status: dto.status as ClaimStatus },
    });

    await this.prisma.claimStatusHistory.create({
      data: {
        claimId,
        oldStatus,
        newStatus: dto.status as ClaimStatus,
        changedBy: adminId,
        note: dto.note,
      },
    });

    await this.adminService.createAuditLog({
      actorId: adminId,
      action: 'UPDATE_CLAIM_STATUS',
      entityType: 'Claim',
      entityId: claimId,
      details: { from: oldStatus, to: dto.status, note: dto.note },
    });

    await this.prisma.notification.create({
      data: {
        userId: claim.userId,
        message: `Your claim ${claim.claimReference} status has been updated to ${dto.status.replace('_', ' ')}.`,
        type: 'claim_status_updated',
        referenceType: 'claim',
        referenceId: claimId,
      },
    });

    await this.sendPushNotification(
      claim.userId,
      'Claim Update — AfriCover247',
      `Your claim ${claim.claimReference} status has been updated to ${dto.status.replace(/_/g, ' ')}.`,
      { referenceType: 'claim', referenceId: claimId, type: 'claim_status_updated' },
    );

    await this.emailService.sendEmail({
      to: claim.user.email,
      subject: `Your claim ${claim.claimReference} has been updated`,
      html: `<p>Your claim status has been updated to <strong>${dto.status.replace(/_/g, ' ')}</strong>.</p>${dto.note ? `<p>${dto.note}</p>` : ''}`,
    });

    if (claim.user.phone) {
      await this.smsService.sendClaimStatusSms(
        claim.user.phone,
        claim.claimReference,
        dto.status,
      );
    }

    return updated;
  }

  // --- Admin: list all claims ---

  findAll(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ClaimWhereInput = {};
    if (filters.status)
      where.status = filters.status as Prisma.EnumClaimStatusFilter['equals'];
    if (filters.search) {
      where.OR = [
        { claimReference: { contains: filters.search, mode: 'insensitive' } },
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

    return this.prisma.claim.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        policy: {
          include: {
            product: { select: { name: true, category: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  // --- Admin: get single claim with full details ---

  async findOneAdmin(id: string) {
    const claim = await this.prisma.claim.findUnique({
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
        policy: { include: { product: true } },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        },
        documents: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        },
      },
    });

    if (!claim) throw new NotFoundException('Claim not found');
    return claim;
  }
}
