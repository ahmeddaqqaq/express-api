import { ApiProperty } from '@nestjs/swagger';
import { ImageResponse } from 'src/image/response';
import { ModelResponse } from 'src/model/dto/response';

export class BrandResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  // @ApiProperty({ type: ImageResponse })
  // logo: ImageResponse;

  @ApiProperty({ type: () => [ModelResponse] })
  models: ModelResponse[];

  @ApiProperty()
  imageId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class BrandManyResponse {
  @ApiProperty({ type: () => [BrandResponse] })
  data: BrandResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
