import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class TransactionFilterDto {
  @ApiProperty({ 
    required: false,
    description: 'Search by customer mobile number, plate number, or transaction ID',
    example: '079123456'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    required: false,
    description: 'Filter transactions by date (YYYY-MM-DD format). If not provided, returns all transactions.',
    example: '2024-12-31',
    format: 'date'
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
