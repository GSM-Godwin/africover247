import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { PERSON_NAME_MAX_LENGTH } from '../../common/helpers/person-name';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(PERSON_NAME_MAX_LENGTH)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(PERSON_NAME_MAX_LENGTH)
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
