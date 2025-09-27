import { ApiProperty } from '@nestjs/swagger';
import { ImageResponse } from 'src/image/response';
import { UserInfoResponse } from 'src/auth/dto/user-info.dto';

export class DailyNoteResponse {
  @ApiProperty({
    description: 'Unique identifier for the daily note',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'The content of the daily note',
    example: 'Today we completed maintenance on the main washing equipment and serviced 15 vehicles.',
  })
  note: string;

  @ApiProperty({
    description: 'ID of the user who created this note',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  createdById: string;

  @ApiProperty({
    description: 'Information about the user who created this note',
    type: () => UserInfoResponse,
  })
  createdBy: UserInfoResponse;

  @ApiProperty({
    description: 'Whether the note is active (soft delete)',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Date and time when the note was created',
    example: '2024-03-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date and time when the note was last updated',
    example: '2024-03-15T10:30:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Images attached to this daily note',
    type: [ImageResponse],
  })
  images: ImageResponse[];
}

export class DailyNotesListResponse {
  @ApiProperty({
    description: 'List of daily notes',
    type: [DailyNoteResponse],
  })
  data: DailyNoteResponse[];

  @ApiProperty({
    description: 'Total number of notes matching the filter',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Number of notes per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;
}