import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';
import { AddOnsResponse } from 'src/add-ons/dto/respons';
import { CarResponse } from 'src/car/dto/response';
import { CustomerResponse } from 'src/customer/responses';
import { ImageResponse } from 'src/image/response';
import { InvoiceResponse } from 'src/invoice/dto/response';
import { ServiceResponse } from 'src/service/dto/response';
import { SupervisorResponse } from 'src/supervisor/dto/response';
import { TechnicianResponse } from 'src/technician/dto/response';

export class TransactionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty()
  isPaid: boolean;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  carId: string;

  @ApiProperty({ type: CustomerResponse })
  customer: CustomerResponse;

  @ApiProperty({ type: CarResponse })
  car: CarResponse;

  @ApiProperty({ type: ServiceResponse })
  service: ServiceResponse;

  @ApiProperty({ type: () => [AddOnsResponse] })
  addOns: [AddOnsResponse];

  @ApiProperty({ type: () => InvoiceResponse })
  invoice: InvoiceResponse;

  @ApiProperty({ type: () => [ImageResponse] })
  images: [ImageResponse];

  @ApiProperty({ type: () => SupervisorResponse })
  createdBy: SupervisorResponse;

  @ApiProperty({ 
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        technicianId: { type: 'string' },
        transactionId: { type: 'string' },
        phase: { type: 'string' },
        assignedAt: { type: 'string', format: 'date-time' },
        startedAt: { type: 'string', format: 'date-time', nullable: true },
        completedAt: { type: 'string', format: 'date-time', nullable: true },
        isActive: { type: 'boolean' },
        technician: { type: 'object' },
      },
    },
  })
  assignments: any[];

  @ApiProperty()
  deliverTime: string;

  @ApiProperty()
  notes: string;

  @ApiProperty()
  OTP: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TransactionManyResponse {
  @ApiProperty({ type: () => [TransactionResponse] })
  data: TransactionResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
