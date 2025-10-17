import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({
    description: 'Customer ID',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  customerId: string;

  @ApiProperty({
    description: 'Reservation date and time',
    example: '2025-10-18T10:00:00.000Z',
  })
  @IsDateString()
  datetime: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the reservation',
    example: 'Customer prefers morning slot',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
