import { Module } from '@nestjs/common';
import { PremiumService } from './premium.service';

@Module({
  providers: [PremiumService],
  exports: [PremiumService],
})
export class PremiumModule {}
