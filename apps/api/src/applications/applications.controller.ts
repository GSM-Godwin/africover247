import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StorageService } from '../storage/storage.service';
import { KycService } from '../kyc/kyc.service';
import { VerifyIdentityDto } from '../kyc/dto/verify-identity.dto';
import { VerifyVehicleDto } from '../kyc/dto/verify-vehicle.dto';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(
    private applicationsService: ApplicationsService,
    private storageService: StorageService,
    private kycService: KycService,
    private prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.create(user.id, dto);
  }

  @Get('my')
  findMy(@CurrentUser() user: { id: string }) {
    return this.applicationsService.findMyApplications(user.id);
  }

  @Get('drafts')
  getAllDrafts(@CurrentUser() user: { id: string }) {
    return this.applicationsService.getAllDrafts(user.id)
  }

  @Get('my/draft/:productId')
  getDraft(
    @CurrentUser() user: { id: string },
    @Param('productId') productId: string,
  ) {
    return this.applicationsService.getDraft(user.id, productId);
  }

  @Post('verify-vehicle')
  @HttpCode(HttpStatus.OK)
  verifyVehicle(@Body() dto: VerifyVehicleDto) {
    return this.kycService.verifyVehicle(dto.plateNumber);
  }

  @Get()
  findByQuote(
    @CurrentUser() user: { id: string },
    @Query('quoteId') quoteId?: string,
  ) {
    if (!quoteId) {
      throw new BadRequestException('quoteId query parameter is required');
    }
    return this.applicationsService.findByQuoteId(user.id, quoteId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.applicationsService.findOne(id, user.id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(id, user.id, dto);
  }

  // --- Verify identity ---

  @Post(':id/verify-identity')
  @HttpCode(HttpStatus.OK)
  async verifyIdentity(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: VerifyIdentityDto,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        kycVerified: true,
        kycVerifiedAt: true,
        kycVerificationType: true,
      },
    });

    if (existingUser?.kycVerified) {
      await this.prisma.application.update({
        where: { id },
        data: { kycVerified: true },
      });
      return {
        verified: true,
        message: `Identity already verified via ${existingUser.kycVerificationType} on ${new Date(existingUser.kycVerifiedAt!).toLocaleDateString('en-NG')}`,
        cached: true,
      };
    }

    return this.applicationsService.verifyIdentity(id, user.id, dto);
  }

  // --- Delete draft ---

  @Delete(':id')
  deleteDraft(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.applicationsService.deleteDraft(id, user.id);
  }

  // --- Document upload ---

  @Post(':id/documents')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadDocument(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('documentType') documentType: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!documentType) throw new BadRequestException('Document type is required');

    await this.applicationsService.findOne(id, user.id);

    const { url } = await this.storageService.uploadDocument(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return this.applicationsService.addDocument(id, {
      documentType,
      fileUrl: url,
      fileName: file.originalname,
    });
  }

  @Get(':id/documents')
  async getDocuments(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    await this.applicationsService.findOne(id, user.id);
    return this.applicationsService.getDocuments(id);
  }

  @Delete(':id/documents/:docId')
  async deleteDocument(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('docId') docId: string,
  ) {
    await this.applicationsService.findOne(id, user.id);
    return this.applicationsService.deleteDocument(
      id,
      docId,
      this.storageService,
    );
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/applications')
export class AdminApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.applicationsService.findAll({
      status,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOneAdmin(id);
  }
}
