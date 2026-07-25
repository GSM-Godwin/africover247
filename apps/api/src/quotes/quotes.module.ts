import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController, AdminQuotesController } from './quotes.controller';
import { EmailModule } from '../email/email.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [EmailModule, SmsModule],
  providers: [QuotesService],
  controllers: [QuotesController, AdminQuotesController],
  exports: [QuotesService],
})
export class QuotesModule {}
