import { Module } from '@nestjs/common';
import { DevicesModule } from 'src/devices/devices.module';
import { StorageModule } from 'src/storage/storage.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { WebsocketModule } from 'src/websocket/websocket.module';
import { MqttController } from './mqtt.controller';
import { MqttService } from './mqtt.service';

@Module({
  imports: [StorageModule, WebsocketModule, SubscriptionsModule, DevicesModule],
  controllers: [MqttController],
  providers: [MqttService],
})
export class MqttModule {}
