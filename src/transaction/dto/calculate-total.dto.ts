import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CalculateTotalDto {
  @ApiProperty()
  @IsUUID()
  serviceId: string;

  @ApiProperty()
  @IsUUID()
  carId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  addOnsIds?: string[];
}
