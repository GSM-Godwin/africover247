import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async logSearch(query: string, resultsCount: number, platform: string) {
    if (!query || query.trim().length < 2) return;
    await this.prisma.searchLog.create({
      data: {
        query: query.trim().toLowerCase(),
        resultsCount,
        platform,
      },
    });
  }

  async getZeroResultQueries(limit = 50) {
    return this.prisma.searchLog.groupBy({
      by: ['query'],
      where: { resultsCount: 0 },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    });
  }

  async getTopSearches(limit = 20) {
    return this.prisma.searchLog.groupBy({
      by: ['query'],
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: limit,
    });
  }

  async getSearchStats() {
    const [total, zeroResults, topQueries] = await Promise.all([
      this.prisma.searchLog.count(),
      this.prisma.searchLog.count({ where: { resultsCount: 0 } }),
      this.getTopSearches(10),
    ]);
    return {
      totalSearches: total,
      zeroResultSearches: zeroResults,
      zeroResultRate: total > 0 ? Math.round((zeroResults / total) * 100) : 0,
      topQueries,
    };
  }
}
