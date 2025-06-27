import { ApiProperty } from '@nestjs/swagger';

export class SupervisorResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SupervisorManyResponse {
  @ApiProperty({ type: () => [SupervisorResponse] })
  data: SupervisorResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
