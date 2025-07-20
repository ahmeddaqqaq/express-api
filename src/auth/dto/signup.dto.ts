import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, IsNotEmpty, IsEnum, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'Ahmad Al-Mohammad',
    minLength: 2,
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Jordanian mobile number (must start with 07)',
    example: '0791234567',
    pattern: '^07[789]\\d{7}$'
  })
  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @ApiProperty({
    description: 'Password for the account (minimum 6 characters)',
    example: 'securePassword123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Role of the user in the system',
    enum: UserRole,
    example: UserRole.SUPERVISOR
  })
  @IsEnum(UserRole)
  role: UserRole;
}
