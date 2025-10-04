import { ApiProperty } from '@nestjs/swagger';

export class DailySubscriptionRevenueResponse {
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2023-12-01',
  })
  date: string;

  @ApiProperty({ description: 'Total revenue from subscriptions on this date' })
  revenue: number;
}
