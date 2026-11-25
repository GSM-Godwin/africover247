import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { PERSON_NAME_MAX_LENGTH } from '../../common/helpers/person-name';

export class AppleAuthDto {
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @IsString()
  @IsOptional()
  @MaxLength(PERSON_NAME_MAX_LENGTH)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(PERSON_NAME_MAX_LENGTH)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2048)
  authorizationCode?: string;
}
