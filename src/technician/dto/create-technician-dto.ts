import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateTechnicianDto {
  @ApiProperty()
  @IsString()
  fName: string;

  @ApiProperty()
  @IsString()
  lName: string;
}
