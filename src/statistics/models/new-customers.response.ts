import { ApiProperty } from '@nestjs/swagger';

export class NewCustomerResponse {
  @ApiProperty({ description: 'Customer ID' })
  id: string;

  @ApiProperty({ description: 'Customer first name' })
  fName: string;

  @ApiProperty({ description: 'Customer last name' })
  lName: string;

  @ApiProperty({ description: 'Customer mobile number' })
  mobileNumber: string;

  @ApiProperty({ description: 'Date when customer was created' })
  createdAt: Date;
}
