import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  PaymentsController,
  PaymentsWebhookController,
  PaymentsStubController,
} from './payments.controller';
import { PaystackService } from './paystack.service';

@Module({
  providers: [PaymentsService, PaystackService],
  controllers: [
    PaymentsController,
    PaymentsWebhookController,
    PaymentsStubController,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
