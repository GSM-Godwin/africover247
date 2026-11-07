import { IsString, Matches } from 'class-validator';

export class VerifyStepUpCodeDto {
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit code from your email' })
  code: string;
}
