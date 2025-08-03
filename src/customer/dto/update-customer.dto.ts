import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateCustomerDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiPropertyOptional({
    description: 'Mobile number of the customer',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional({
    description: 'Count value',
    example: 5,
    required: false,
  })
  @IsOptional()
  @IsInt()
  count?: number;

  @ApiPropertyOptional({
    description: 'First name of the customer',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  fName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the customer',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  lName?: string;

  @ApiPropertyOptional({
    description: 'Whether the customer is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the customer is blacklisted',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isBlacklisted?: boolean;
}
