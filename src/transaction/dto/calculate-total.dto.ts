import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CalculateTotalDto {
  @ApiProperty({
    description: 'Service ID to calculate price for',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  serviceId: string;

  @ApiProperty({
    description: 'Car ID to determine car type for pricing',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  @IsUUID()
  carId: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of add-on service IDs to include in total (optional)',
    example: ['550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003']
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  addOnsIds?: string[];
}
