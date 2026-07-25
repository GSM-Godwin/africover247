import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class RespondQuoteDto {
  @IsNumber()
  @Min(0)
  quoteAmount: number;

  @IsString()
  @IsOptional()
  note?: string;
}
