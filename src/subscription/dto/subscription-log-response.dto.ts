import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionAction } from '@prisma/client';

export class UserInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  mobileNumber: string;
}

export class SubscriptionLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  customerSubscriptionId: string;

  @ApiProperty({ enum: SubscriptionAction })
  action: SubscriptionAction;

  @ApiProperty({ type: () => UserInfoDto, required: false })
  purchasedBy?: UserInfoDto;

  @ApiProperty({ required: false })
  purchasedAt?: Date;

  @ApiProperty({ type: () => UserInfoDto, required: false })
  activatedBy?: UserInfoDto;

  @ApiProperty({ required: false })
  activatedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SubscriptionLogListResponseDto {
  @ApiProperty({ type: [SubscriptionLogResponseDto] })
  data: SubscriptionLogResponseDto[];

  @ApiProperty()
  total: number;
}
