import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateCarDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  brandId: string;

  @ApiProperty()
  @IsUUID()
  modelId: string;

  @ApiProperty()
  @IsString()
  plateNumber: string;

  @ApiProperty()
  @IsString()
  year: string;
}
