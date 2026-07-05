import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsIn(['Motor', 'Health', 'SSLAG/SSPP', 'Other'])
  category: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  premiumAmount: number;

  @IsString()
  @IsIn(['annual', 'monthly'])
  premiumFrequency: string;

  @IsInt()
  @Min(1)
  durationMonths: number;

  @IsString()
  @IsNotEmpty()
  coverageHighlights: string;

  @IsString()
  @IsOptional()
  exclusions?: string;

  @IsString()
  @IsOptional()
  requiredDocuments?: string;
}
