import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CarFilterDto {
  @IsOptional()
  @IsString()
  search?: string;
}
