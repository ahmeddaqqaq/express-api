import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserInfoResponse {
  @ApiProperty({
    description: 'User ID',
    example: '97f70358-0f24-477f-8cfc-35b9179f0ee4',
  })
  userId: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    description: 'User mobile number',
    example: '0798765432',
  })
  mobileNumber: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: 'ADMIN',
  })
  role: UserRole;

  @ApiProperty({
    description: 'Whether user is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'User creation date',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}