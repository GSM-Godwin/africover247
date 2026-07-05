import {
  IsUUID,
  IsString,
  IsIn,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class CreateClaimDto {
  @IsUUID()
  policyId: string;

  @IsString()
  @IsIn(['Motor Accident', 'Theft', 'Fire', 'Medical', 'Other'])
  claimType: string;

  @IsDateString()
  incidentDate: string;

  @IsString()
  @IsNotEmpty()
  incidentLocation: string;

  @IsString()
  @MinLength(50, {
    message: 'Please provide at least 50 characters describing the incident',
  })
  description: string;

  @IsNumber()
  @IsOptional()
  estimatedAmount?: number;

  @IsBoolean()
  policeReportFiled: boolean;

  @IsString()
  @IsOptional()
  policeReportNumber?: string;
}
