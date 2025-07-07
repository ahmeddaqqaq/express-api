import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum TimeRange {
  DAY = 'day',
  MONTH = 'month',
  YEAR = 'year',
  ALL = 'all',
}

export class StatsFilterDto {
  @ApiPropertyOptional({ enum: TimeRange, default: TimeRange.ALL })
  @IsOptional()
  @IsEnum(TimeRange)
  range?: TimeRange = TimeRange.ALL;

  @ApiPropertyOptional()
  @IsOptional()
  customStart?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  customEnd?: Date;
}