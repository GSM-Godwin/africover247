import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class VerifyVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  plateNumber: string;
}
