import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SigninDto {
  @ApiProperty({
    description: 'Jordanian mobile number used for authentication',
    example: '0791234567',
    pattern: '^07[789]\\d{7}$'
  })
  @IsString()
  mobileNumber: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'securePassword123',
    minLength: 6
  })
  @IsString()
  @MinLength(6)
  password: string;
}
