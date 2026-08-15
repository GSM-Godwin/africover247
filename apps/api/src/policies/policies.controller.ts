import { Controller, Get, Param, Patch, Post, Query, Body, UseGuards } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('policies')
export class PoliciesController {
  constructor(private policiesService: PoliciesService) {}

  @Get('my')
  findMy(@CurrentUser() user: { id: string }) {
    return this.policiesService.findMyPolicies(user.id);
  }

  @Post(':id/snooze-reminder')
  snoozeReminder(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { until: string },
  ) {
    return this.policiesService.snoozeRenewalReminder(id, user.id, new Date(body.until));
  }

  @Get(':id')
  findOne(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.policiesService.findOne(id, user.id);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/policies')
export class AdminPoliciesController {
  constructor(private policiesService: PoliciesService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.policiesService.findAll({
      status,
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('renewals')
  getRenewals(@Query('days') days?: string) {
    return this.policiesService.getRenewalsForAdmin(days ? parseInt(days) : 30);
  }

  @Get('renewal-stats')
  getRenewalStats() {
    return this.policiesService.getRenewalStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.policiesService.findOneAdmin(id);
  }

  @Patch(':id/cancel')
  cancelPolicy(@Param('id') id: string) {
    return this.policiesService.cancelPolicy(id);
  }
}
