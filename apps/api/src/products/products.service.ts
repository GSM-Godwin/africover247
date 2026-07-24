import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // --- Customer-facing ---

  findAll() {
    return this.prisma.product.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // --- Admin ---

  findAllAdmin() {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        premiumAmount: dto.premiumAmount,
        durationMonths: dto.durationMonths,
        coverageHighlights: dto.coverageHighlights,
        exclusions: dto.exclusions ?? '',
        requiredDocuments: dto.requiredDocuments ?? '',
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async setStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
