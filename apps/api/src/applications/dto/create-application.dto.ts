import { IsUUID, IsObject, IsOptional } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  productId: string;

  @IsObject()
  @IsOptional()
  assetDetails?: Record<string, unknown>;
}
