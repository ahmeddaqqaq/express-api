import { ApiProperty } from '@nestjs/swagger';

export class ServiceResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ServiceManyResponse {
  @ApiProperty({ type: () => [ServiceResponse] })
  data: ServiceResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
