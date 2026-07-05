import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateClaimStatusDto {
  @IsString()
  @IsIn(['in_review', 'approved', 'rejected'])
  status: string;

  @IsString()
  @IsOptional()
  note?: string;
}
