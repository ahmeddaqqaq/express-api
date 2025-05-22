import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CustomerModule } from './customer/customer.module';
import { CarModule } from './car/car.module';
import { BrandModule } from './brand/brand.module';
import { ModelModule } from './model/model.module';
import { TransactionModule } from './transaction/transaction.module';
import { TechnicianModule } from './technician/technician.module';
import { ServiceModule } from './service/service.module';
import { AddOnsModule } from './add-ons/add-ons.module';
import { InvoiceModule } from './invoice/invoice.module';
import { StatisticsModule } from './statistics/statistics.module';
import { S3Module } from './s3/s3.module';
import { ImageModule } from './image/image.module';

@Module({
  imports: [
    PrismaModule,
    CustomerModule,
    CarModule,
    BrandModule,
    ModelModule,
    TransactionModule,
    TechnicianModule,
    ServiceModule,
    AddOnsModule,
    InvoiceModule,
    StatisticsModule,
    S3Module,
    ImageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
