import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateTransactionDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty({ enum: TransactionStatus, required: false })
  @IsOptional()
  @IsString()
  status?: TransactionStatus;

  @ApiPropertyOptional({
    type: [String],
    description: 'IDs of images to attach',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  imageIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'IDs of technicians to assign to this transaction',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  technicianIds?: string[];
}
