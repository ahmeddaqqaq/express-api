import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class PurchaseSubscriptionDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Car ID' })
  @IsString()
  @IsUUID()
  carId: string;

  @ApiProperty({ description: 'Subscription ID' })
  @IsString()
  @IsUUID()
  subscriptionId: string;

  @ApiProperty({ description: 'User ID who purchased (optional)', required: false })
  @IsString()
  @IsUUID()
  @IsOptional()
  purchasedById?: string;
}

export class ActivateSubscriptionDto {
  @ApiProperty({ description: 'Customer Subscription ID' })
  @IsString()
  @IsUUID()
  customerSubscriptionId: string;

  @ApiProperty({ description: 'QR Code ID to activate' })
  @IsString()
  @IsUUID()
  qrCodeId: string;

  @ApiProperty({ description: 'User ID who activated (optional)', required: false })
  @IsString()
  @IsUUID()
  @IsOptional()
  activatedById?: string;
}