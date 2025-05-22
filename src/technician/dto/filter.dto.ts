import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TechnicianFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
