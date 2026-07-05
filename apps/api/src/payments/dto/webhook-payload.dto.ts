import { IsString, IsObject, IsOptional } from 'class-validator';

export class WebhookPayloadDto {
  @IsString()
  event: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;
}
