import { ApiProperty } from '@nestjs/swagger';

export class TopCustomer {
  @ApiProperty()
  customerId: string;

  @ApiProperty()
  customerName: string;

  @ApiProperty()
  mobileNumber: string;

  @ApiProperty()
  totalSpent: number;

  @ApiProperty()
  transactionCount: number;
}
