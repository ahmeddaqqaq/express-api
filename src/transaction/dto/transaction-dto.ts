import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  carId: string;

  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  technicianIds?: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  addOnsIds?: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty()
  @IsUUID()
  supervisorId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  deliverTime?: string;

  @ApiProperty()
  @IsUUID()
  serviceId: string;
}
