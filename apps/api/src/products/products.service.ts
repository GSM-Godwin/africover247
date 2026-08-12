import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { expandSearchTerms } from './search-synonyms';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  // --- Customer-facing ---

  async findAll(search?: string, category?: string, platform = 'web') {
    const where: any = { status: 'active' };

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (search) {
      const expandedTerms = expandSearchTerms(search);

      where.OR = expandedTerms.flatMap((term) => [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ]);
    }

    const results = await this.prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (search) {
      this.searchService
        .logSearch(search, results.length, platform)
        .catch(() => {});
    }

    return results;
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
