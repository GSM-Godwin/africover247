import { IsUUID } from 'class-validator';

export class CreateApplicationDto {
  @IsUUID()
  productId: string;
}
