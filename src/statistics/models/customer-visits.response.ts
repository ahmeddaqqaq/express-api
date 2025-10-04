import { ApiProperty } from '@nestjs/swagger';

export class CustomerVisitsResponse {
  @ApiProperty({ description: 'Customer ID' })
  customerId: string;

  @ApiProperty({ description: 'Number of completed visits for this customer' })
  visitCount: number;
}
