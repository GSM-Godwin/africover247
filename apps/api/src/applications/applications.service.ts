import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

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
        formData: {},
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

  // --- Get single application ---

  async findOne(id: string, userId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        product: true,
        kycDocuments: true,
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

    return this.prisma.application.update({
      where: { id },
      data: {
        formData: mergedFormData as Prisma.InputJsonValue,
        stepCompleted,
        updatedAt: new Date(),
      },
      include: { product: true },
    });
  }

  // --- Get draft for product ---

  getDraft(userId: string, productId: string) {
    return this.prisma.application.findFirst({
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
        policy: true,
      },
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  // --- Add KYC document record ---

  addDocument(
    applicationId: string,
    data: {
      documentType: string;
      fileUrl: string;
      fileName: string;
      publicId: string;
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
