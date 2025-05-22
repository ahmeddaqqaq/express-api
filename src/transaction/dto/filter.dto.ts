import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TransactionFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
