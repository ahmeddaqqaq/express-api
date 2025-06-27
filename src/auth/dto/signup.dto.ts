import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, IsNotEmpty, IsEnum, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({
    description: 'Username',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Mobile number',
    example: '07XXXXXXXX',
  })
  @IsString()
  mobileNumber: string;

  @ApiProperty({
    description: 'Password for the account (min 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: UserRole,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
