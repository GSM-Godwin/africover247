import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KycService } from './kyc.service';

@Module({
  imports: [ConfigModule],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}
