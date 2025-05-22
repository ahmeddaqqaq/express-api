import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsMobilePhone,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'First name of the customer',
  })
  @IsString()
  @IsNotEmpty()
  fName: string;

  @ApiProperty({
    description: 'Last name of the customer',
  })
  @IsString()
  @IsNotEmpty()
  lName: string;

  @ApiPropertyOptional({
    description: 'Mobile number of the customer',
  })
  @IsOptional()
  @IsString()
  @IsMobilePhone()
  mobileNumber?: string;

  @ApiPropertyOptional({
    description: 'Initial count value',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  count?: number;

  @ApiPropertyOptional({
    description: 'Whether the customer is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
