import { ApiProperty } from '@nestjs/swagger';
import { AuditLogResponse } from 'src/audit-log/response';

export class TechnicianResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fName: string;

  @ApiProperty()
  lName: string;

  @ApiProperty()
  status: boolean;

  @ApiProperty({ required: false })
  lastAction: string;

  @ApiProperty()
  totalShiftTime: string;

  @ApiProperty()
  totalBreakTime: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TechnicianManyResponse {
  @ApiProperty({ type: () => [TechnicianResponse] })
  data: TechnicianResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
