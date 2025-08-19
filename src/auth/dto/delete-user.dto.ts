import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class DeleteUserDto {
  @ApiProperty({
    description: 'Jordanian mobile number used for authentication',
    example: '0791234567',
    pattern: '^07[789]\\d{7}$',
  })
  @IsString()
  mobileNumber: string;
}
