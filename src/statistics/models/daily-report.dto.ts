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

  @ApiProperty({ description: 'Total shift time in HH:MM:SS format' })
  totalShiftTime: string;

  @ApiProperty({ description: 'Total break time in HH:MM:SS format' })
  totalBreakTime: string;

  @ApiProperty({ description: 'Total overtime in HH:MM:SS format' })
  totalOvertimeTime: string;

  @ApiProperty({ description: 'Total working time (shift + overtime - break) in HH:MM:SS format' })
  totalWorkingTime: string;

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

export class SupervisorSalesReport {
  @ApiProperty({ description: 'Supervisor ID' })
  supervisorId: string;

  @ApiProperty({ description: 'Supervisor full name' })
  supervisorName: string;

  @ApiProperty({ description: 'Total add-on revenue sold by supervisor' })
  totalAddOnRevenue: number;

  @ApiProperty({ description: 'Number of add-ons sold' })
  addOnCount: number;
}

export class DailyReportResponseDto {
  @ApiProperty({ description: 'Report date' })
  date: string;

  @ApiProperty({ description: 'Technician shift information', type: [TechnicianShiftReport] })
  technicianShifts: TechnicianShiftReport[];

  @ApiProperty({ description: 'Cash summary for the day', type: CashSummary })
  cashSummary: CashSummary;

  @ApiProperty({ description: 'Supervisor sales for add-ons', type: [SupervisorSalesReport] })
  supervisorSales: SupervisorSalesReport[];

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: string;
}