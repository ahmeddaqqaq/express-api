import { ApiProperty } from '@nestjs/swagger';

export class SalesResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  mobileNumber?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SalesManyResponse {
  @ApiProperty()
  rows: number;

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty({ type: [SalesResponse] })
  data: SalesResponse[];
}