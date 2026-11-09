import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class SendStepUpCodeDto {
  @IsOptional()
  @IsUUID()
  applicationId?: string;

  @IsOptional()
  @IsIn(['monthly', 'annual'])
  paymentPlan?: 'monthly' | 'annual';
}
