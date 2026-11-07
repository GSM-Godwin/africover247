import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class AppleAuthDto {
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  authorizationCode?: string;
}
