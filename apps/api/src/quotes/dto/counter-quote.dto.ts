import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CounterQuoteDto {
  @IsNumber()
  @Min(0)
  counterAmount: number;

  @IsString()
  @IsOptional()
  note?: string;
}
