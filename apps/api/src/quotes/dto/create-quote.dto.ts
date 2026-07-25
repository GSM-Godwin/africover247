import { IsUUID, IsObject, IsNotEmpty } from 'class-validator';

export class CreateQuoteDto {
  @IsUUID()
  productId: string;

  @IsObject()
  @IsNotEmpty()
  customerDetails: Record<string, unknown>;
}
