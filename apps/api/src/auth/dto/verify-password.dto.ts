import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  password: string;
}
