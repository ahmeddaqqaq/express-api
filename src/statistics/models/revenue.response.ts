import { ApiProperty } from '@nestjs/swagger';

export class ServiceRevenue {
  @ApiProperty()
  serviceId: string;

  @ApiProperty()
  serviceName: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  totalRevenue: number;
}

export class AddOnRevenue {
  @ApiProperty()
  addOnId: string;

  @ApiProperty()
  addOnName: string;

  @ApiProperty()
  count: number;

  @ApiProperty()
  totalRevenue: number;
}

export class RevenueSummary {
  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  serviceRevenue: number;

  @ApiProperty()
  addOnRevenue: number;

  @ApiProperty({ type: [ServiceRevenue] })
  services: ServiceRevenue[];

  @ApiProperty({ type: [AddOnRevenue] })
  addOns: AddOnRevenue[];
}
