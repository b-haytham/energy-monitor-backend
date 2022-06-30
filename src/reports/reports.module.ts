import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportsScheduleService } from './reports.schedule';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Report, ReportSchema } from './entities/report.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Report.name, schema: ReportSchema }]),
    SubscriptionsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsScheduleService],
  exports: [ReportsService],
})
export class ReportsModule {}
