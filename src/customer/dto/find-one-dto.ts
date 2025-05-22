import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class FindOneCustomerDto {
  @ApiProperty()
  @IsUUID()
  id: string;
}
