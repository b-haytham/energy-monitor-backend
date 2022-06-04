import { Module } from '@nestjs/common';
import { StorageModule } from 'src/storage/storage.module';
import { MqttController } from './mqtt.controller';
import { MqttService } from './mqtt.service';

@Module({
  imports: [StorageModule],
  controllers: [MqttController],
  providers: [MqttService],
})
export class MqttModule {}
