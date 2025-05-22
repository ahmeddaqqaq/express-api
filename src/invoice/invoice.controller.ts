import { Controller } from '@nestjs/common';
import { InvoiceService } from './invoice.service';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('Invoice')
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}
}
