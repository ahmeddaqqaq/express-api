import { ApiProperty } from '@nestjs/swagger';

export class ModelResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  brandId: string;

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
