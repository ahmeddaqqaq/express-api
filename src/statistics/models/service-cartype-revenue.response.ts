import { ApiProperty } from '@nestjs/swagger';

export class ServiceCarTypeRevenueResponse {
  @ApiProperty({ description: 'Service ID' })
  serviceId: string;

  @ApiProperty({ description: 'Service name' })
  serviceName: string;

  @ApiProperty({ description: 'Car type' })
  carType: string;

  @ApiProperty({ description: 'Total completed transactions for this service-carType combination' })
  completedCount: number;

  @ApiProperty({ description: 'Total revenue generated from this service-carType combination' })
  totalRevenue: number;
}
