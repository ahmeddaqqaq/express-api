import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class AssignSubscriptionDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ description: 'Car ID' })
  @IsString()
  @IsNotEmpty()
  carId: string;

  @ApiProperty({ description: 'Subscription template ID' })
  @IsString()
  @IsNotEmpty()
  subscriptionId: string;
}

export class AssignQRCodeDto {
  @ApiProperty({ description: 'Customer subscription ID' })
  @IsString()
  @IsNotEmpty()
  customerSubscriptionId: string;

  @ApiProperty({ description: 'QR Code ID' })
  @IsString()
  @IsNotEmpty()
  qrCodeId: string;
}

export class UseServiceDto {
  @ApiProperty({ description: 'QR Code string' })
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @ApiProperty({ description: 'Service ID to use' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;
}