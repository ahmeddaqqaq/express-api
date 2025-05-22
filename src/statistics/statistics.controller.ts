import { Controller, Get } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CardStatsResponse,
  CompletionRatioResponse,
  TopBrandsResponse,
} from './models/response';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @ApiResponse({
    status: '4XX',
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
        },
      },
    },
    type: CardStatsResponse,
  })
  @Get('cardStats')
  async getCardStats() {
    return await this.statisticsService.getDashboardStatistics();
  }

  @ApiResponse({
    status: '4XX',
    schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
        },
      },
    },
    type: CompletionRatioResponse,
  })
  @Get('completionRatios')
  async getRatio() {
    return await this.statisticsService.serviceCompletion();
  }
}
