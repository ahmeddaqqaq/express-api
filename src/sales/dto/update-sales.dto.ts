import { IsString, IsOptional, IsBoolean, IsMobilePhone, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSalesDto {
  @ApiProperty({ description: 'Sales person ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ 
    description: 'First name of the sales person',
    required: false 
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ 
    description: 'Last name of the sales person',
    required: false 
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ 
    description: 'Mobile number of the sales person',
    required: false 
  })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiProperty({ 
    description: 'Is the sales person active',
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}