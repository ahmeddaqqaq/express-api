import { ApiProperty } from '@nestjs/swagger';

export class AddOnsResponse {
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

export class AddOnsManyResponse {
  @ApiProperty({ type: () => [AddOnsResponse] })
  data: AddOnsResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
