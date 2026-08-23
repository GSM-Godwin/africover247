import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SlaSchedulerService } from './sla-scheduler.service';
import { CallLogService } from './call-log.service';
import { EmailModule } from '../email/email.module';
import { AdminModule } from '../admin/admin.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [EmailModule, NotificationsModule, AdminModule],
  controllers: [SupportController],
  providers: [SupportService, SlaSchedulerService, CallLogService],
  exports: [SupportService, CallLogService],
})
export class SupportModule {}
