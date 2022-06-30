import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Alert, AlertSchema } from './entities/alert.entity';
import { DevicesModule } from 'src/devices/devices.module';
import {
  TriggeredAlerts,
  TriggeredAlertsSchema,
} from './entities/triggered-alerts.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Alert.name, schema: AlertSchema },
      { name: TriggeredAlerts.name, schema: TriggeredAlertsSchema },
    ]),
    DevicesModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
