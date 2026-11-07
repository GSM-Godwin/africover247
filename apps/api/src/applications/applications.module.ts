import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import {
  ApplicationsController,
  AdminApplicationsController,
} from './applications.controller';
import { StorageModule } from '../storage/storage.module';
import { KycModule } from '../kyc/kyc.module';
import { PremiumModule } from '../premium/premium.module';

@Module({
  imports: [StorageModule, KycModule, PremiumModule],
  providers: [ApplicationsService],
  controllers: [ApplicationsController, AdminApplicationsController],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
