import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional } from 'class-validator';

export class UseServiceDto {
  @ApiProperty({ description: 'QR Code to scan' })
  @IsString()
  qrCode: string;

  @ApiProperty({ description: 'Service ID to use' })
  @IsString()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ description: 'User ID who is performing the service', required: false })
  @IsOptional()
  @IsString()
  @IsUUID()
  usedById?: string;

  @ApiProperty({ description: 'Notes about the service usage', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}