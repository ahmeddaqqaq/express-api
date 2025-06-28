import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum } from 'class-validator';
import { CarType } from '@prisma/client';

export class CreateModelDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsUUID()
  brandId: string;

  @ApiProperty({
    enum: CarType,
    enumName: 'CarType',
    default: CarType.Sedan,
  })
  @IsEnum(CarType)
  type: CarType;
}
