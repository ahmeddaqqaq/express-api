import { IsInt, IsString, Min } from 'class-validator';

export class BulkUpdateSubscriptionDto {
  @IsString()
  subscriptionName: string;

  @IsInt()
  @Min(1)
  days: number;
}
