import { ApiProperty } from '@nestjs/swagger';
import { TransactionStatus } from '@prisma/client';

export class ImageResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ enum: TransactionStatus, required: false })
  uploadedAtStage?: TransactionStatus;

  @ApiProperty({ 
    required: false,
    description: 'User who uploaded this image'
  })
  uploadedBy?: {
    id: string;
    name: string;
    role: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ImageManyResponse {
  @ApiProperty({ type: () => [ImageResponse] })
  data: ImageResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
