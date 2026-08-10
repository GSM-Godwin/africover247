import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class InitiatePaymentDto {
  @IsUUID()
  applicationId: string;

  @IsIn(['monthly', 'annual'])
  @IsOptional()
  paymentPlan?: 'monthly' | 'annual';
}
