import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsMobilePhone, MinLength } from 'class-validator';

export class SigninDto {
  @ApiProperty({
    description: 'Mobile number used to sign in',
    example: '07XXXXXXXX',
  })
  @IsString()
  @IsMobilePhone()
  mobileNumber: string;

  @ApiProperty({
    description: 'User password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
