// service-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { CarType } from '@prisma/client';

class PriceByCarType {
  @ApiProperty({ enum: CarType })
  carType: CarType;

  @ApiProperty()
  price: number;
}

export class ServiceResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [PriceByCarType] })
  prices: PriceByCarType[];
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
