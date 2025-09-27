import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateDailyNoteDto {
  @ApiProperty({
    description: 'The content of the daily note',
    example: 'Today we completed maintenance on the main washing equipment and serviced 15 vehicles. The new technician is adapting well to our processes.',
  })
  @IsString()
  @IsNotEmpty()
  note: string;

  @ApiProperty({
    description: 'Array of image IDs to attach to this note',
    type: [String],
    required: false,
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  imageIds?: string[];
}