import { IsIn, IsString, ValidateIf } from 'class-validator';

export class VerifyIdentityDto {
  @IsIn(['bvn', 'nin', 'drivers_licence', 'passport'])
  verificationType: 'bvn' | 'nin' | 'drivers_licence' | 'passport';

  @IsString()
  value: string;

  @ValidateIf(
    (dto: VerifyIdentityDto) =>
      dto.verificationType === 'drivers_licence' ||
      dto.verificationType === 'passport',
  )
  @IsString()
  dateOfBirth?: string;

  @ValidateIf((dto: VerifyIdentityDto) => dto.verificationType === 'passport')
  @IsString()
  lastName?: string;
}
