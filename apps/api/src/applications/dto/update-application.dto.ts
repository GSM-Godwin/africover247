import { IsObject, IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateApplicationDto {
  @IsObject()
  @IsOptional()
  formData?: Record<string, unknown>;

  @IsInt()
  @Min(0)
  @Max(4)
  @IsOptional()
  stepCompleted?: number;
}
