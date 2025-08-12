import { IsString, IsOptional, IsBoolean, IsMobilePhone } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSalesDto {
  @ApiProperty({ description: 'First name of the sales person' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name of the sales person' })
  @IsString()
  lastName: string;

  @ApiProperty({ 
    description: 'Mobile number of the sales person',
    required: false 
  })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiProperty({ 
    description: 'Is the sales person active',
    default: true,
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}