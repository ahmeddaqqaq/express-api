import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SupervisorFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
