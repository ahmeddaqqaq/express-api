import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'ID of the user to update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'Ahmad Al-Mohammad',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Jordanian mobile number (must start with 07)',
    example: '0791234567',
    pattern: '^07[789]\\d{7}$',
    required: false,
  })
  @IsString()
  @IsOptional()
  mobileNumber?: string;
}
