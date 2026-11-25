import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { PERSON_NAME_MAX_LENGTH } from '../../common/helpers/person-name';

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @IsString()
  @IsOptional()
  @MaxLength(PERSON_NAME_MAX_LENGTH)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(PERSON_NAME_MAX_LENGTH)
  lastName?: string;
}
