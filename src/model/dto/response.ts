import { ApiProperty } from '@nestjs/swagger';
import { CarType } from '@prisma/client';

export class ModelResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  brandId: string;

  @ApiProperty({ enum: CarType })
  carType: CarType;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ModelManyResponse {
  @ApiProperty({ type: () => [ModelResponse] })
  data: ModelResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
