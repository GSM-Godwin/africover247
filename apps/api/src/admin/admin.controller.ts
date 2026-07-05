import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // --- Dashboard ---

  @Get('dashboard/metrics')
  getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('dashboard/activity')
  getActivity(@Query('limit') limit?: string) {
    return this.adminService.getActivity(limit ? parseInt(limit) : 10);
  }

  @Get('dashboard/pending-claims')
  getPendingClaims(@Query('limit') limit?: string) {
    return this.adminService.getPendingClaims(limit ? parseInt(limit) : 5);
  }

  @Get('dashboard/recent-applications')
  getRecentApplications(@Query('limit') limit?: string) {
    return this.adminService.getRecentApplications(limit ? parseInt(limit) : 5);
  }

  // --- Audit log ---

  @Get('audit-logs')
  getAuditLogs(
    @Query('search') search?: string,
    @Query('actorId') actorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs({
      search,
      actorId,
      from,
      to,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
}
