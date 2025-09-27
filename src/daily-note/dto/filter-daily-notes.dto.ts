import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsUUID } from 'class-validator';

export class FilterDailyNotesDto {
  @ApiProperty({
    description: 'Filter by specific date (YYYY-MM-DD)',
    required: false,
    example: '2024-03-15',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    description: 'Filter by date range - start date (YYYY-MM-DD)',
    required: false,
    example: '2024-03-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Filter by date range - end date (YYYY-MM-DD)',
    required: false,
    example: '2024-03-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Filter by user who created the note',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  createdById?: string;
}