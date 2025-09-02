import { ApiProperty } from '@nestjs/swagger';
import { CarType } from '@prisma/client';

export class SubscriptionServiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  serviceId: string;

  @ApiProperty()
  serviceName: string;

  @ApiProperty()
  usageCount: number;
}

export class SubscriptionPriceResponseDto {
  @ApiProperty({ enum: CarType })
  carType: CarType;

  @ApiProperty()
  price: number;
}

export class SubscriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  endDate?: Date;

  @ApiProperty({ required: false })
  maxUsesPerService?: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [SubscriptionServiceResponseDto] })
  services: SubscriptionServiceResponseDto[];

  @ApiProperty({ type: [SubscriptionPriceResponseDto] })
  prices: SubscriptionPriceResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CustomerSubscriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerId: string;

  @ApiProperty()
  carId: string;

  @ApiProperty()
  subscriptionId: string;

  @ApiProperty()
  qrCodeId: string;

  @ApiProperty()
  qrCode: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  purchaseDate: Date;

  @ApiProperty({ required: false })
  activationDate?: Date;

  @ApiProperty({ required: false })
  expiryDate?: Date;

  @ApiProperty()
  totalPrice: number;

  @ApiProperty()
  subscription: SubscriptionResponseDto;

  @ApiProperty()
  remainingServices: Array<{
    serviceId: string;
    serviceName: string;
    remainingCount: number;
    totalCount: number;
  }>;
}