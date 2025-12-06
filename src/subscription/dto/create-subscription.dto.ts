import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CarType } from '@prisma/client';

export class SubscriptionServiceDto {
  @ApiProperty({ description: 'Service ID' })
  @IsString()
  serviceId: string;

  @ApiProperty({ description: 'Number of times this service can be used' })
  @IsInt()
  @Min(1)
  usageCount: number;
}

export class SubscriptionPriceDto {
  @ApiProperty({ enum: CarType, description: 'Car type for pricing' })
  @IsEnum(CarType)
  carType: CarType;

  @ApiProperty({ description: 'Price for this car type' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'POS service ID for this car type' })
  @IsInt()
  posServiceId: number;
}

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Subscription name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Subscription description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Subscription end date (optional)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Maximum uses per service (optional)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsesPerService?: number;

  @ApiProperty({ description: 'Duration in days for customer subscriptions', required: false, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationInDays?: number;

  @ApiProperty({ type: [SubscriptionServiceDto], description: 'Services included in subscription' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubscriptionServiceDto)
  services: SubscriptionServiceDto[];

  @ApiProperty({ type: [SubscriptionPriceDto], description: 'Pricing per car type' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubscriptionPriceDto)
  prices: SubscriptionPriceDto[];
}

export class UpdateSubscriptionDto extends CreateSubscriptionDto {}