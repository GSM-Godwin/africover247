import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import {
  PoliciesController,
  AdminPoliciesController,
} from './policies.controller';
import { EmailModule } from '../email/email.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [EmailModule, StorageModule],
  providers: [PoliciesService],
  controllers: [PoliciesController, AdminPoliciesController],
  exports: [PoliciesService],
})
export class PoliciesModule {}
