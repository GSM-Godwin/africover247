import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { EmailModule } from '../email/email.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [EmailModule, AdminModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
