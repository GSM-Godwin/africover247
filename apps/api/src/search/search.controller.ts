import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('log')
  @SkipThrottle()
  logSearch(
    @Body() body: { query: string; resultsCount: number; platform: string },
  ) {
    return this.searchService.logSearch(
      body.query,
      body.resultsCount,
      body.platform,
    );
  }

  @Get('analytics/zero-results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getZeroResults(@Query('limit') limit?: string) {
    return this.searchService.getZeroResultQueries(
      limit ? parseInt(limit) : 50,
    );
  }

  @Get('analytics/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getStats() {
    return this.searchService.getSearchStats();
  }

  @Get('analytics/top')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getTopSearches(@Query('limit') limit?: string) {
    return this.searchService.getTopSearches(limit ? parseInt(limit) : 20);
  }
}
