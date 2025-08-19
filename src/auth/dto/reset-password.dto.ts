import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Jordanian mobile number of the user whose password to reset',
    example: '0791234567',
    pattern: '^07[789]\\d{7}$',
  })
  @IsString()
  mobileNumber: string;

  @ApiProperty({
    description: 'New password for the account (minimum 6 characters)',
    example: 'newSecurePassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}