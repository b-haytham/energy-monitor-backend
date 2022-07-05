import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { AlertsModule } from 'src/alerts/alerts.module';
import { DataModule } from 'src/data/data.module';
import { ReportsModule } from 'src/reports/reports.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { JobsService } from './jobs.service';
import { MailProcessor } from './mail.processor';
import { NotificationsProcessor } from './notifications.processor';
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
    BullModule.registerQueue({
      name: 'notifications',
    }),
    SubscriptionsModule,
    DataModule,
    ReportsModule,
    AlertsModule,
    WebsocketModule,
  ],
  providers: [
    JobsService,
    MailProcessor,
    ReportsProcessor,
    NotificationsProcessor,
  ],
  exports: [BullModule],
})
export class JobsModule {}
