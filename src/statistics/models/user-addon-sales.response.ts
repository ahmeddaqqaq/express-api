import { ApiProperty } from '@nestjs/swagger';

export class UserAddOnSalesResponse {
  @ApiProperty({ description: 'User ID or Sales Person ID' })
  userId: string;

  @ApiProperty({ description: 'User or Sales Person name' })
  userName: string;

  @ApiProperty({ description: 'Total revenue from add-on sales' })
  totalAddOnRevenue: number;

  @ApiProperty({ description: 'Total count of add-ons sold' })
  addOnCount: number;
}
