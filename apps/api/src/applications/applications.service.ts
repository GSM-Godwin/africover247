import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { StorageService } from '../storage/storage.service';
import { KycService, type KycResult } from '../kyc/kyc.service';
import { VerifyIdentityDto } from '../kyc/dto/verify-identity.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private kycService: KycService,
  ) {}

  // --- Create new application ---

  async create(userId: string, dto: CreateApplicationDto) {
    const existing = await this.prisma.application.findFirst({
      where: {
        userId,
        productId: dto.productId,
        status: { in: ['draft', 'pending_payment'] },
      },
    });
    if (existing)
      throw new ConflictException(
        'You already have an active application for this product. Please complete or cancel it first.',
      );

    return this.prisma.application.create({
      data: {
        userId,
        productId: dto.productId,
        status: 'draft',
        stepCompleted: 0,
        formData: {
          ...(dto.assetDetails ? { assetDetails: dto.assetDetails } : {}),
          ...(dto.calculatedPremium ? { calculatedPremium: dto.calculatedPremium } : {}),
        } as Prisma.InputJsonValue,
        assetDetails: (dto.assetDetails ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
      include: { product: true },
    });
  }

  // --- List user applications ---

  findMyApplications(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      include: {
        product: { select: { name: true, category: true, premiumAmount: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByQuoteId(userId: string, quoteId: string) {
    const applications = await this.prisma.application.findMany({
      where: {
        userId,
        status: 'pending_payment',
      },
      include: {
        product: { select: { name: true, category: true, premiumAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.filter((app) => {
      const formData = app.formData as Record<string, unknown> | null;
      return formData?.quoteId === quoteId;
    });
  }

  // --- Get single application ---

  async findOne(id: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        product: true,
        kycDocuments: true,
        policy: true,
      },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.userId !== userId)
      throw new ForbiddenException(
        'You do not have access to this application',
      );
    return application;
  }

  // --- Update application (draft save) ---

  async update(id: string, userId: string, dto: UpdateApplicationDto) {
    const application = await this.findOne(id, userId);

    const mergedFormData = {
      ...((application.formData as Record<string, unknown>) || {}),
      ...(dto.formData || {}),
    };

    const stepCompleted =
      dto.stepCompleted !== undefined &&
      dto.stepCompleted > application.stepCompleted
        ? dto.stepCompleted
        : application.stepCompleted;

    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        formData: mergedFormData as Prisma.InputJsonValue,
        stepCompleted,
        updatedAt: new Date(),
      },
      include: { product: true },
    });

    await this.redisService.saveDraft(id, mergedFormData);

    return updated;
  }

  // --- Get all drafts ---

  async getAllDrafts(userId: string) {
    return this.prisma.application.findMany({
      where: {
        userId,
        status: 'draft',
      },
      include: {
        product: {
          select: { id: true, name: true, category: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  // --- Get draft for product ---

  async getDraft(userId: string, productId: string) {
    const application = await this.prisma.application.findFirst({
      where: {
        userId,
        productId,
        status: { in: ['draft', 'pending_payment'] },
      },
      include: {
        product: { select: { name: true, category: true, premiumAmount: true } },
        kycDocuments: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!application) return null;

    const redisDraft = await this.redisService.getDraft(application.id);
    if (redisDraft) {
      return {
        ...application,
        formData: redisDraft,
      };
    }

    return application;
  }

  // --- Clear Redis draft on terminal status ---

  clearDraft(applicationId: string) {
    return this.redisService.deleteDraft(applicationId);
  }

  // --- Delete draft application ---

  async deleteDraft(applicationId: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) throw new NotFoundException('Application not found');

    if (application.userId !== userId) {
      throw new UnauthorizedException(
        'You do not have access to this application',
      );
    }

    if (!['draft', 'pending_payment'].includes(application.status)) {
      throw new BadRequestException('Only draft applications can be deleted');
    }

    await this.prisma.kycDocument.deleteMany({
      where: { applicationId },
    });

    await this.prisma.payment.deleteMany({
      where: { applicationId },
    });

    await this.redisService.deleteDraft(applicationId);

    await this.prisma.application.delete({
      where: { id: applicationId },
    });

    return { deleted: true, applicationId };
  }

  // --- Admin: list all applications ---

  findAll(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {};
    if (filters.status) where.status = filters.status as Prisma.EnumApplicationStatusFilter['equals'];
    if (filters.search) {
      where.user = {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.application.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        product: { select: { name: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  // --- Admin: get single application with full details ---

  async findOneAdmin(id: string) {
    const application = await this.prisma.application.findUnique({
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
        kycDocuments: true,
        payments: {
          select: { id: true, status: true, amount: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        policy: {
          select: {
            id: true,
            policyNumber: true,
            status: true,
            policyPdfUrl: true,
          },
        },
      },
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  // --- Verify identity ---

  async verifyIdentity(
    id: string,
    userId: string,
    dto: VerifyIdentityDto,
  ): Promise<KycResult> {
    const application = await this.findOne(id, userId);

    let result: KycResult;

    switch (dto.verificationType) {
      case 'bvn':
        result = await this.kycService.verifyBvn(dto.value);
        break;
      case 'nin':
        result = await this.kycService.verifyNin(dto.value);
        break;
      case 'drivers_licence':
        result = await this.kycService.verifyDriversLicence(
          dto.value,
          dto.dateOfBirth!,
        );
        break;
      case 'passport':
        result = await this.kycService.verifyPassport(
          dto.value,
          dto.lastName!,
          dto.dateOfBirth!,
        );
        break;
      default:
        throw new BadRequestException('Unsupported verification type');
    }

    const existingFormData =
      (application.formData as Record<string, unknown>) || {};

    const updatedFormData = {
      ...existingFormData,
      kycVerification: {
        type: dto.verificationType,
        verified: result.verified,
        verifiedAt: new Date().toISOString(),
        message: result.message ?? null,
      },
    };

    await this.prisma.application.update({
      where: { id },
      data: {
        formData: updatedFormData as Prisma.InputJsonValue,
        ...(result.verified ? { kycVerified: true } : {}),
      },
    });

    return result;
  }

  // --- Add KYC document record ---

  addDocument(
    applicationId: string,
    data: {
      documentType: string;
      fileUrl: string;
      fileName: string;
    },
  ) {
    return this.prisma.kycDocument.create({
      data: {
        applicationId,
        documentType: data.documentType,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
      },
    });
  }

  // --- List documents for application ---

  getDocuments(applicationId: string) {
    return this.prisma.kycDocument.findMany({
      where: { applicationId },
      orderBy: { uploadedAt: 'asc' },
    });
  }

  // --- Delete document ---

  async deleteDocument(
    applicationId: string,
    docId: string,
    storageService: StorageService,
  ) {
    const doc = await this.prisma.kycDocument.findFirst({
      where: { id: docId, applicationId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    await this.prisma.kycDocument.delete({ where: { id: docId } });
    return { message: 'Document deleted successfully' };
  }
}
