import { ApiProperty } from '@nestjs/swagger';

export class InvoiceResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  transactionId: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class InvoiceManyResponse {
  @ApiProperty({ type: () => [InvoiceResponse] })
  data: InvoiceResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
