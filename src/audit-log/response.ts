import { ApiProperty } from '@nestjs/swagger';
import { TechnicianResponse } from 'src/technician/dto/response';

export class AuditLogResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: () => TechnicianResponse })
  technician: TechnicianResponse;

  @ApiProperty()
  action: string;

  @ApiProperty({ type: () => Date })
  timeStamp: Date;
}

export class AuditLogManyResponse {
  @ApiProperty({ type: () => [AuditLogResponse] })
  data: AuditLogResponse[];

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  rows: number;
}
