import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { TransactionStatus } from '@prisma/client';

export class FilterImagesDto {
  @ApiProperty({ 
    enum: TransactionStatus, 
    required: false,
    description: 'Filter images by the transaction stage they were uploaded in'
  })
  @IsOptional()
  @IsEnum(TransactionStatus)
  uploadedAtStage?: TransactionStatus;
}