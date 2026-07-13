import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import {
  PoliciesController,
  AdminPoliciesController,
} from './policies.controller';
import { EmailModule } from '../email/email.module';
import { StorageModule } from '../storage/storage.module';
import { ApplicationsModule } from '../applications/applications.module';

@Module({
  imports: [EmailModule, StorageModule, ApplicationsModule],
  providers: [PoliciesService],
  controllers: [PoliciesController, AdminPoliciesController],
  exports: [PoliciesService],
})
export class PoliciesModule {}
