import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  password?: string;
}
