import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
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
import { SupervisorModule } from './supervisor/supervisor.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuthModule } from './auth/auth.module';
import { SeederModule } from './seeder/seeder.module';
import { IntegrationModule } from './integration/integration.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SalesModule } from './sales/sales.module';
import { RefreshTokenMiddleware } from './auth/refresh-token.middleware';

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
    SupervisorModule,
    AuditLogModule,
    AuthModule,
    SeederModule,
    IntegrationModule,
    SchedulerModule,
    SalesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RefreshTokenMiddleware)
      .exclude('auth/(.*)')  // Don't apply to auth routes
      .forRoutes('*');       // Apply to all other routes
  }
}
