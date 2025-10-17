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

  @ApiProperty()
  posServiceId: number;
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

export class RemainingServiceDto {
  @ApiProperty()
  serviceId: string;

  @ApiProperty()
  serviceName: string;

  @ApiProperty()
  remainingCount: number;

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  usedCount: number;

  @ApiProperty({ required: false })
  lastUsed?: Date;
}

export class CustomerInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  mobileNumber: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isBlacklisted: boolean;
}

export class CarBrandDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class CarModelDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: CarType })
  type: CarType;
}

export class CarInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  plateNumber: string;

  @ApiProperty({ type: CarBrandDto })
  brand: CarBrandDto;

  @ApiProperty({ type: CarModelDto })
  model: CarModelDto;

  @ApiProperty({ required: false })
  year?: number;

  @ApiProperty({ required: false })
  color?: string;
}

export class SubscriptionStatusDto {
  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isActivated: boolean;

  @ApiProperty()
  isExpired: boolean;

  @ApiProperty()
  canUseServices: boolean;
}

export class SubscriptionPricingDto {
  @ApiProperty()
  totalPrice: number;
}

export class SubscriptionDatesDto {
  @ApiProperty()
  purchaseDate: Date;

  @ApiProperty({ required: false })
  activationDate?: Date;

  @ApiProperty({ required: false })
  expiryDate?: Date;

  @ApiProperty({ required: false })
  daysUntilExpiry?: number;
}

export class SubscriptionBasicInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;
}

export class AllCustomerSubscriptionsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  qrCode?: string;

  @ApiProperty()
  isActivated: boolean;

  @ApiProperty({ type: CustomerInfoDto })
  customer: CustomerInfoDto;

  @ApiProperty({ type: SubscriptionBasicInfoDto })
  subscription: SubscriptionBasicInfoDto;

  @ApiProperty({ type: CarInfoDto })
  car: CarInfoDto;

  @ApiProperty({ type: [RemainingServiceDto] })
  remainingServices: RemainingServiceDto[];

  @ApiProperty()
  totalServicesRemaining: number;

  @ApiProperty({ type: SubscriptionStatusDto })
  status: SubscriptionStatusDto;

  @ApiProperty({ type: SubscriptionPricingDto })
  pricing: SubscriptionPricingDto;

  @ApiProperty({ type: SubscriptionDatesDto })
  dates: SubscriptionDatesDto;
}
