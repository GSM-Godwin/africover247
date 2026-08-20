import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { PolicySchedulerService } from './policy-scheduler.service';
import {
  PoliciesController,
  AdminPoliciesController,
} from './policies.controller';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { StorageModule } from '../storage/storage.module';
import { ApplicationsModule } from '../applications/applications.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    EmailModule,
    SmsModule,
    StorageModule,
    ApplicationsModule,
    NotificationsModule,
    AdminModule,
  ],
  providers: [PoliciesService, PolicySchedulerService],
  controllers: [PoliciesController, AdminPoliciesController],
  exports: [PoliciesService],
})
export class PoliciesModule {}
