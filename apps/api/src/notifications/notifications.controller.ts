import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Query('unread') unread?: string,
  ) {
    return this.notificationsService.findMyNotifications(
      user.id,
      unread === 'true',
    );
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch('read-by-reference')
  @HttpCode(HttpStatus.OK)
  markReadByReference(
    @CurrentUser() user: { id: string },
    @Body() body: { referenceType: string; referenceId: string },
  ) {
    return this.notificationsService.markReadByReference(
      user.id,
      body.referenceType,
      body.referenceId,
    );
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(id, user.id);
  }
}
