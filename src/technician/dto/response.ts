import { ApiProperty } from '@nestjs/swagger';

export class TechnicianResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fName: string;

  @ApiProperty()
  lName: string;

  @ApiProperty()
  mobileNumber: string;

  @ApiProperty()
  status: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TechnicianManyResponse {
  @ApiProperty({ type: () => [TechnicianResponse] })
  data: TechnicianResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
