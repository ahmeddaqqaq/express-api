import { ApiProperty } from '@nestjs/swagger';

export class ReservationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({
    example: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      mobileNumber: '0791234567',
    },
  })
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    mobileNumber: string;
  };

  @ApiProperty({ example: '2025-10-18T10:00:00.000Z' })
  datetime: Date;

  @ApiProperty({ example: 'Customer prefers morning slot', required: false })
  notes?: string;

  @ApiProperty({ example: false })
  markAsDone: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-10-17T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-17T08:00:00.000Z' })
  updatedAt: Date;
}
