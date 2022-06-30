import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { DataModule } from 'src/data/data.module';
import { ReportsModule } from 'src/reports/reports.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { JobsService } from './jobs.service';
import { MailProcessor } from './mail.processor';
import { ReportsProcessor } from './reports.processor';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail',
    }),
    BullModule.registerQueue({
      name: 'reports',
    }),
    SubscriptionsModule,
    DataModule,
    ReportsModule,
  ],
  providers: [JobsService, MailProcessor, ReportsProcessor],
  exports: [BullModule],
})
export class JobsModule {}
