import { IsString, IsOptional, MinLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  lastName?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(\+234|0)[789][01]\d{8}$/, {
    message: 'Please enter a valid Nigerian phone number',
  })
  phone?: string;

  @IsString()
  @IsOptional()
  @Matches(/^(\+234|0)[789][01]\d{8}$/, {
    message: 'Please enter a valid Nigerian phone number',
  })
  alternativePhone?: string;
}
