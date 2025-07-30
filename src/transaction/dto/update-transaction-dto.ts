import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateTransactionDto {
  @ApiProperty({
    description: 'Transaction ID to update'
  })
  @IsUUID()
  id: string;

  @ApiProperty({ 
    enum: TransactionStatus, 
    required: false,
    description: 'New status for the transaction'
  })
  @IsOptional()
  @IsString()
  status?: TransactionStatus;

  @ApiPropertyOptional({
    description: 'ID of the technician making this update (for audit logging)',
  })
  @IsOptional()
  @IsUUID()
  updatedByTechnicianId?: string;
}

export class EditScheduledTransactionDto {
  @ApiProperty({
    description: 'Transaction ID to edit (must be in scheduled status)'
  })
  @IsUUID()
  id: string;

  @ApiPropertyOptional({
    description: 'New service ID',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of addon IDs to replace current addons',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  addOnsIds?: string[];

  @ApiPropertyOptional({
    description: 'Updated delivery time',
  })
  @IsOptional()
  @IsString()
  deliverTime?: string;

  @ApiPropertyOptional({
    description: 'Updated notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelTransactionDto {
  @ApiPropertyOptional({
    description: 'Notes for cancellation reason',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignTechnicianToPhaseDto {
  @ApiProperty({
    description: 'Transaction ID'
  })
  @IsUUID()
  transactionId: string;

  @ApiProperty({
    type: [String],
    description: 'Array of technician IDs to assign'
  })
  @IsArray()
  @IsUUID('4', { each: true })
  technicianIds: string[];

  @ApiProperty({
    enum: ['stageOne', 'stageTwo', 'stageThree'],
    description: 'Phase to assign technicians to'
  })
  @IsString()
  phase: 'stageOne' | 'stageTwo' | 'stageThree';
}
