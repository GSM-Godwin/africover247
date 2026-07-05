import { IsIn } from 'class-validator';

export class SetProductStatusDto {
  @IsIn(['active', 'inactive'])
  status: string;
}
