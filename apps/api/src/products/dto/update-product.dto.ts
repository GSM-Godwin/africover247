import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsIn(['Motor', 'Health', 'SSLAG/SSPP', 'Other'])
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  premiumAmount?: number;

  @IsString()
  @IsIn(['annual', 'monthly'])
  @IsOptional()
  premiumFrequency?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationMonths?: number;

  @IsString()
  @IsOptional()
  coverageHighlights?: string;

  @IsString()
  @IsOptional()
  exclusions?: string;

  @IsString()
  @IsOptional()
  requiredDocuments?: string;
}
