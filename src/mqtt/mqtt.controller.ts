import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  MqttContext,
  Payload,
} from '@nestjs/microservices';
import { DeviceNotificationDto } from './dto/DeviceNotification.dto';
import { MqttService } from './mqtt.service';

@Controller('mqtt')
export class MqttController {
  private readonly logger = new Logger(MqttController.name);

  constructor(private mqttService: MqttService) {}

  @MessagePattern('device/notification')
  async deviceNotification(
    @Payload() data: DeviceNotificationDto,
    @Ctx() ctx: MqttContext,
  ) {
    return this.mqttService.handleDeviceNotification(data);
  }
}
