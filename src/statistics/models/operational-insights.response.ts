import { ApiProperty } from '@nestjs/swagger';

export class PeakHoursResponse {
  @ApiProperty()
  hour: number;

  @ApiProperty()
  transactionCount: number;

  @ApiProperty()
  percentage: number;
}

export class PeakDaysResponse {
  @ApiProperty()
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.

  @ApiProperty()
  dayName: string;

  @ApiProperty()
  transactionCount: number;

  @ApiProperty()
  percentage: number;
}

export class TechnicianUtilizationResponse {
  @ApiProperty()
  technicianId: string;

  @ApiProperty()
  technicianName: string;

  @ApiProperty()
  totalTransactions: number;

  @ApiProperty()
  completedTransactions: number;

  @ApiProperty()
  inProgressTransactions: number;

  @ApiProperty()
  utilizationRate: number; // percentage

  @ApiProperty()
  completionRate: number; // percentage
}

export class ServiceStageBottleneckResponse {
  @ApiProperty()
  stage: string;

  @ApiProperty()
  averageTimeInStage: number; // in hours

  @ApiProperty()
  transactionCount: number;

  @ApiProperty()
  bottleneckScore: number; // higher score = more bottleneck
}

export class PeakAnalysisResponse {
  @ApiProperty({ type: [PeakHoursResponse] })
  peakHours: PeakHoursResponse[];

  @ApiProperty({ type: [PeakDaysResponse] })
  peakDays: PeakDaysResponse[];
}

export class OperationalInsightsResponse {
  @ApiProperty({ type: PeakAnalysisResponse })
  peakAnalysis: PeakAnalysisResponse;

  @ApiProperty({ type: [TechnicianUtilizationResponse] })
  technicianUtilization: TechnicianUtilizationResponse[];

  @ApiProperty({ type: [ServiceStageBottleneckResponse] })
  stageBottlenecks: ServiceStageBottleneckResponse[];
}