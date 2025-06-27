import { ApiProperty } from '@nestjs/swagger';
import { CarResponse } from 'src/car/dto/response';

export class CustomerResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fName: string;

  @ApiProperty()
  lName: string;

  @ApiProperty()
  mobileNumber: string;

  @ApiProperty()
  count: number;

  @ApiProperty({ type: () => [CarResponse] })
  cars: CarResponse[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}

export class CustomersManyResponse {
  @ApiProperty({ type: () => [CustomerResponse] })
  data: CustomerResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
