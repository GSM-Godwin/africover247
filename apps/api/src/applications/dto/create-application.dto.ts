import { IsUUID, IsObject, IsOptional, IsNumber } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  productId: string;

  @IsObject()
  @IsOptional()
  assetDetails?: Record<string, unknown>;

  @IsNumber()
  @IsOptional()
  calculatedPremium?: number;
}
