import { Module } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './entities/device.entity';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    SubscriptionsModule,
  ],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
