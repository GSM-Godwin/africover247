import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CallLogService } from './call-log.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('support')
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly callLogService: CallLogService,
  ) {}

  // --- Customer: create ticket ---
  @Post('tickets')
  @UseGuards(OptionalJwtAuthGuard)
  createTicket(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user?: { id: string },
  ) {
    return this.supportService.createTicket({
      ...(body as Parameters<SupportService['createTicket']>[0]),
      userId: user?.id,
    });
  }

  // --- Customer: my tickets ---
  @Get('tickets/my')
  @UseGuards(JwtAuthGuard)
  getMyTickets(@CurrentUser() user: { id: string }) {
    return this.supportService.getMyTickets(user.id);
  }

  // --- Customer: ticket by ID ---
  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard)
  getTicket(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.supportService.getTicketById(id, user.id);
  }

  // --- Customer: add response ---
  @Post('tickets/:id/responses')
  @UseGuards(JwtAuthGuard)
  addResponse(
    @Param('id') id: string,
    @Body() body: { message: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.supportService.addResponse(id, body.message, false, user.id);
  }

  // --- Customer: create appointment ---
  @Post('appointments')
  @UseGuards(OptionalJwtAuthGuard)
  createAppointment(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user?: { id: string },
  ) {
    const dto = body as {
      name: string;
      email: string;
      phone: string;
      preferredDate: string;
      alternateDate?: string;
      topic: string;
      notes?: string;
    };
    return this.supportService.createAppointment({
      userId: user?.id,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      preferredDate: new Date(dto.preferredDate),
      alternateDate: dto.alternateDate ? new Date(dto.alternateDate) : undefined,
      topic: dto.topic,
      notes: dto.notes,
    });
  }

  // --- Customer: my appointments ---
  @Get('appointments/my')
  @UseGuards(JwtAuthGuard)
  getMyAppointments(@CurrentUser() user: { id: string }) {
    return this.supportService.getMyAppointments(user.id);
  }

  // --- Admin: all tickets ---
  @Get('admin/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAllTickets(@Query('status') status?: string) {
    return this.supportService.getAllTickets(status);
  }

  // --- Admin: ticket stats ---
  @Get('admin/tickets/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getTicketStats() {
    return this.supportService.getTicketStats();
  }

  // --- Admin: update ticket status ---
  @Patch('admin/tickets/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateTicketStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { status: string; adminNote?: string },
  ) {
    return this.supportService.updateTicketStatus(
      id,
      body.status,
      body.adminNote,
      user.id,
    );
  }

  // --- Admin: add response to ticket ---
  @Post('admin/tickets/:id/responses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  addAdminResponse(
    @Param('id') id: string,
    @Body() body: { message: string },
  ) {
    return this.supportService.addResponse(id, body.message, true);
  }

  // --- Admin: all appointments ---
  @Get('admin/appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAllAppointments() {
    return this.supportService.getAllAppointments();
  }

  // --- Admin: update appointment ---
  @Patch('admin/appointments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateAppointment(
    @Param('id') id: string,
    @Body() body: { status: string; confirmedDate?: string; adminNote?: string },
  ) {
    return this.supportService.updateAppointment(
      id,
      body.status,
      body.confirmedDate ? new Date(body.confirmedDate) : undefined,
      body.adminNote,
    );
  }

  @Post('calls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  createCallLog(
    @CurrentUser() user: { id: string },
    @Body() body: Record<string, unknown>,
  ) {
    return this.callLogService.createLog(
      user.id,
      body as Parameters<CallLogService['createLog']>[1],
    );
  }

  @Get('calls/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getCallStats() {
    return this.callLogService.getStats();
  }

  @Get('calls')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getCallLogs(
    @Query('adminId') adminId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
  ) {
    return this.callLogService.getLogs({ adminId, from, to, search });
  }

  @Delete('calls/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteCallLog(@Param('id') id: string) {
    return this.callLogService.deleteLog(id);
  }
}
