import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionServicesUsageResponse {
  @ApiProperty({ description: 'Service ID' })
  serviceId: string;

  @ApiProperty({ description: 'Service name' })
  serviceName: string;

  @ApiProperty({
    description: 'Total number of service allocations across all subscriptions',
  })
  totalAllocated: number;

  @ApiProperty({ description: 'Total number of services used' })
  totalUsed: number;

  @ApiProperty({ description: 'Total number of unused services' })
  totalUnused: number;

  @ApiProperty({
    description: 'Number of subscriptions including this service',
  })
  subscriptionCount: number;
}
