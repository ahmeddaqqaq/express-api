import { IsUUID, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignSalesToAddonsDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsUUID()
  transactionId: string;

  @ApiProperty({ description: 'Sales person ID' })
  @IsUUID()
  salesId: string;

  @ApiProperty({ 
    description: 'List of addon names assigned to this sales person',
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  addOnNames: string[];
}