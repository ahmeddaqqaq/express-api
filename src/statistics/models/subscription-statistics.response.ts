import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionStatisticsResponse {
  @ApiProperty({
    description: 'Total number of subscriptions purchased in the period',
  })
  totalSubscriptions: number;

  @ApiProperty({ description: 'Number of active subscriptions' })
  activeSubscriptions: number;

  @ApiProperty({ description: 'Number of activated subscriptions' })
  activatedSubscriptions: number;

  @ApiProperty({ description: 'Number of expired subscriptions' })
  expiredSubscriptions: number;

  @ApiProperty({ description: 'Number of subscriptions pending activation' })
  pendingActivation: number;
}
