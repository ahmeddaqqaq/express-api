import { ApiProperty } from '@nestjs/swagger';

export class CardStatsResponse {
  @ApiProperty()
  activeCustomers: number;

  @ApiProperty()
  completedTransactions: number;

  @ApiProperty()
  newCustomersToday: number;

  @ApiProperty()
  completedTransactionsToday: number;

  @ApiProperty()
  scheduledTransactions: number;

  @ApiProperty()
  inProgressTransaction: number;
}

export class CompletionRatioResponse {
  @ApiProperty()
  completionRatio: number;
}

export class TopBrandsResponse {
  @ApiProperty()
  name: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  percentage: number;
}
