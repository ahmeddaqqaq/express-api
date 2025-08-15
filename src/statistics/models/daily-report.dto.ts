import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class DailyReportRequestDto {
  @ApiProperty({
    description: 'Date for the daily report (YYYY-MM-DD format)',
    example: '2023-12-01',
  })
  @IsDateString()
  date: string;
}

export class TechnicianShiftReport {
  @ApiProperty({ description: 'Technician ID' })
  technicianId: string;

  @ApiProperty({ description: 'Technician full name' })
  technicianName: string;

  @ApiProperty({ description: 'Shift start time in HH:MM:SS format' })
  shiftStartTime: string;

  @ApiProperty({ description: 'Shift end time in HH:MM:SS format' })
  shiftEndTime: string;

  @ApiProperty({ description: 'Total shift time in HH:MM:SS format' })
  totalShiftTime: string;

  @ApiProperty({ description: 'Total break time in HH:MM:SS format' })
  totalBreakTime: string;

  @ApiProperty({ description: 'Total overtime in HH:MM:SS format' })
  totalOvertimeTime: string;

  @ApiProperty({ description: 'Total working time (shift + overtime - break) in HH:MM:SS format' })
  totalWorkingTime: string;

  @ApiProperty({ description: 'Overtime compensation in dollars (overtime minutes * $0.025 per minute)' })
  overtimeCompensation: number;

  @ApiProperty({ description: 'Whether technician worked on this date' })
  worked: boolean;
}

export class CashSummary {
  @ApiProperty({ description: 'Total revenue from services' })
  servicesCash: number;

  @ApiProperty({ description: 'Total revenue from add-ons' })
  addOnsCash: number;

  @ApiProperty({ description: 'Total cash (services + add-ons)' })
  totalCash: number;

  @ApiProperty({ description: 'Number of completed transactions' })
  transactionCount: number;
}

export class UserSalesReport {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User full name' })
  userName: string;

  @ApiProperty({ description: 'User role' })
  userRole: string;

  @ApiProperty({ description: 'Services sold', type: 'object', properties: {
    count: { type: 'number' },
    total: { type: 'number' }
  }})
  services: { count: number; total: number };

  @ApiProperty({ description: 'Add-ons sold', type: 'object', properties: {
    count: { type: 'number' },
    total: { type: 'number' }
  }})
  addOns: { count: number; total: number };

  @ApiProperty({ description: 'Sales commission from add-ons (5% of total add-on sales)' })
  addOnCommission: number;
}

export class DailyReportResponseDto {
  @ApiProperty({ description: 'Report date' })
  date: string;

  @ApiProperty({ description: 'Technician shift information', type: [TechnicianShiftReport] })
  technicianShifts: TechnicianShiftReport[];

  @ApiProperty({ description: 'Cash summary for the day', type: CashSummary })
  cashSummary: CashSummary;

  @ApiProperty({ description: 'User sales for add-ons', type: [UserSalesReport] })
  userSales: UserSalesReport[];

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: string;
}