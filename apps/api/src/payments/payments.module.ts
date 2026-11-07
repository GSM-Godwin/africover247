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
import { PremiumModule } from '../premium/premium.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PoliciesModule, ApplicationsModule, PremiumModule, AuthModule],
  providers: [PaymentsService, MonnifyService],
  controllers: [
    PaymentsController,
    PaymentsWebhookController,
    PaymentsStubController,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
