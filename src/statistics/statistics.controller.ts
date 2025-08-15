import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { CardStatsResponse, CompletionRatioResponse } from './models/response';
import { StatsFilterDto } from './models/stats-filter.dto';
import { RevenueSummary } from './models/revenue.response';
import { TopCustomer } from './models/top-customer-response';
import {
  PeakAnalysisResponse,
  TechnicianUtilizationResponse,
  ServiceStageBottleneckResponse,
} from './models/operational-insights.response';
import { DailyReportResponseDto } from './models/daily-report.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('Statistics')
@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
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
    type: PeakAnalysisResponse,
  })
  @Get('peakAnalysis')
  async getPeakAnalysis(@Query() filter: StatsFilterDto) {
    return await this.statisticsService.getPeakAnalysis(filter);
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
    type: [TechnicianUtilizationResponse],
  })
  @Get('technicianUtilization')
  async getTechnicianUtilization(@Query() filter: StatsFilterDto) {
    return await this.statisticsService.getTechnicianUtilization(filter);
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
    type: [ServiceStageBottleneckResponse],
  })
  @Get('stageBottlenecks')
  async getServiceStageBottlenecks(@Query() filter: StatsFilterDto) {
    return await this.statisticsService.getServiceStageBottlenecks(filter);
  }

  @ApiResponse({
    status: 200,
    description: 'Returns user add-on sales statistics',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          userName: { type: 'string' },
          totalAddOnRevenue: { type: 'number' },
          addOnCount: { type: 'number' },
        },
      },
    },
  })
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
  })
  @Get('userAddOnSales')
  async getUserAddOnSales(@Query() filter: StatsFilterDto) {
    return await this.statisticsService.getUserAddOnSales(filter);
  }

  @ApiResponse({
    status: 200,
    description: 'Returns comprehensive daily report with technician shifts, cash summary, and user sales',
    type: DailyReportResponseDto,
  })
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
  })
  @ApiQuery({
    name: 'date',
    required: true,
    type: String,
    description: 'Date for the daily report in YYYY-MM-DD format',
    example: '2023-12-01',
  })
  @Get('dailyReport')
  async getDailyReport(@Query('date') date: string) {
    return await this.statisticsService.getDailyReport(date);
  }

  @ApiResponse({
    status: 200,
    description: 'Returns detailed sales report showing who sold what',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          transactionId: { type: 'string' },
          saleType: { type: 'string', enum: ['SERVICE', 'ADDON'] },
          itemName: { type: 'string' },
          price: { type: 'number' },
          quantity: { type: 'number' },
          totalAmount: { type: 'number' },
          soldAt: { type: 'string', format: 'date-time' },
          sellerType: { type: 'string', enum: ['USER', 'SALES_PERSON'] },
          sellerName: { type: 'string' },
          sellerRole: { type: 'string' },
          transactionStatus: { type: 'string' },
        },
      },
    },
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for the report (YYYY-MM-DD)',
    example: '2023-12-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for the report (YYYY-MM-DD)',
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'includeIncomplete',
    required: false,
    type: Boolean,
    description: 'Include sales from incomplete transactions',
    example: false,
  })
  @Get('detailedSalesReport')
  async getDetailedSalesReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeIncomplete') includeIncomplete?: boolean,
  ) {
    // Use DateUtils to ensure business day boundaries
    const { DateUtils } = require('../utils/date-utils');
    const start = startDate 
      ? DateUtils.getStartOfDayUTC3(new Date(startDate))
      : DateUtils.getStartOfDayUTC3(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // Default: 30 days ago
    const end = endDate 
      ? DateUtils.getEndOfDayUTC3(new Date(endDate))
      : DateUtils.getEndOfDayUTC3(new Date()); // Default: today
    
    return await this.statisticsService.salesRecordService.getDetailedSalesReport(
      start,
      end,
      includeIncomplete || false
    );
  }

}
