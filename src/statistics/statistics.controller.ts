import { Controller, Get, Query } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CardStatsResponse, CompletionRatioResponse } from './models/response';
import { StatsFilterDto } from './models/stats-filter.dto';
import { RevenueSummary } from './models/revenue.response';
import { TopCustomer } from './models/top-customer-response';

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
  async getCardStats(@Query() filter: StatsFilterDto) {
    return await this.statisticsService.getDashboardStatistics(filter);
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
  async getRatio(@Query() filter: StatsFilterDto) {
    return await this.statisticsService.serviceCompletion(filter);
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
    type: RevenueSummary,
  })
  @Get('revenue')
  async getRevenueStatistics(@Query() filter: StatsFilterDto) {
    return await this.statisticsService.getRevenueStatistics(filter);
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
    type: TopCustomer,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of top customers to return (default: 5)',
  })
  @Get('topCustomers')
  async getTopCustomers(
    @Query() filter: StatsFilterDto,
    @Query('limit') limit = 5,
  ) {
    return await this.statisticsService.getTopCustomers(filter, limit);
  }
}
