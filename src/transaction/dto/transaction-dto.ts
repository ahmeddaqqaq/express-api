import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Customer ID who owns the car',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'Car ID to be serviced',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  @IsUUID()
  carId: string;

  @ApiProperty({ 
    type: [String],
    description: 'Array of add-on service IDs (optional)',
    required: false,
    example: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003']
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  addOnsIds?: string[];

  @ApiProperty({
    description: 'Additional notes for the transaction (optional)',
    required: false,
    example: 'Customer requested extra attention to scratches on front bumper'
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({
    description: 'ID of the supervisor creating this transaction',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440004',
    required: false
  })
  @IsUUID()
  @IsOptional()
  createdById?: string;

  @ApiProperty({
    description: 'Expected delivery time (optional)',
    required: false,
    example: '14:30'
  })
  @IsString()
  @IsOptional()
  deliverTime?: string;

  @ApiProperty({
    description: 'Service type ID to be performed',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440005'
  })
  @IsUUID()
  serviceId: string;
}
