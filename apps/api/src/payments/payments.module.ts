import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  PaymentsController,
  PaymentsWebhookController,
  PaymentsStubController,
} from './payments.controller';
import { MonnifyService } from './monnify.service';
import { PoliciesModule } from '../policies/policies.module';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [PoliciesModule, ApplicationsModule],
  providers: [PaymentsService, MonnifyService],
  controllers: [
    PaymentsController,
    PaymentsWebhookController,
    PaymentsStubController,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
