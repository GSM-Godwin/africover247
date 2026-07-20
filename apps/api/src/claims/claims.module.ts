import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsController, AdminClaimsController } from './claims.controller';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { AdminModule } from '../admin/admin.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [EmailModule, SmsModule, AdminModule, StorageModule],
  providers: [ClaimsService],
  controllers: [ClaimsController, AdminClaimsController],
  exports: [ClaimsService],
})
export class ClaimsModule {}
