import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateReservationDto {
  @ApiPropertyOptional({
    description: 'Reservation date and time',
    example: '2025-10-18T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  datetime?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the reservation',
    example: 'Customer prefers morning slot',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Mark reservation as done',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  markAsDone?: boolean;
}
