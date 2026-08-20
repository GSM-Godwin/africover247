import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuoteSchedulerService } from './quote-scheduler.service';
import { QuotesController, AdminQuotesController } from './quotes.controller';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [EmailModule, SmsModule, AdminModule],
  providers: [QuotesService, QuoteSchedulerService],
  controllers: [QuotesController, AdminQuotesController],
  exports: [QuotesService],
})
export class QuotesModule {}
