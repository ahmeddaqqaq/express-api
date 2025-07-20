import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateTechnicianDto {
  @ApiProperty({
    description: 'Technician first name',
    example: 'Ahmad',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  fName: string;

  @ApiProperty({
    description: 'Technician last name',
    example: 'Al-Mohammad',
    minLength: 2,
    maxLength: 50
  })
  @IsString()
  lName: string;
}
