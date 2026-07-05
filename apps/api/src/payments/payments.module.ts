import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  PaymentsController,
  PaymentsWebhookController,
  PaymentsStubController,
} from './payments.controller';
import { PaystackService } from './paystack.service';
import { PoliciesModule } from '../policies/policies.module';

@Module({
  imports: [PoliciesModule],
  providers: [PaymentsService, PaystackService],
  controllers: [
    PaymentsController,
    PaymentsWebhookController,
    PaymentsStubController,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
