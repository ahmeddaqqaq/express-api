import { ApiProperty } from '@nestjs/swagger';
import { Brand, Model } from '@prisma/client';
import { BrandResponse } from 'src/brand/dto/response';
import { ModelResponse } from 'src/model/dto/response';

export class CarResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  brandId: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  modelId: string;

  @ApiProperty({ type: BrandResponse })
  brand: Brand;

  @ApiProperty({ type: ModelResponse })
  model: Model;

  @ApiProperty()
  year: string;

  @ApiProperty()
  plateNumber: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ManyCarsResponse {
  @ApiProperty({ type: () => [CarResponse] })
  data: CarResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
