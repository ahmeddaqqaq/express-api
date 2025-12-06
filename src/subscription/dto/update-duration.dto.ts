import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateDurationDto {
  @ApiProperty({
    description: 'Duration in days for customer subscriptions',
    example: 60,
    minimum: 1
  })
  @IsInt()
  @Min(1)
  durationInDays: number;
}
