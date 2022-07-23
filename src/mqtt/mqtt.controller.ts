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
  // private readonly logger = new Logger(MqttController.name);

  constructor(private mqttService: MqttService) {}

  @MessagePattern('device/notification')
  async deviceNotification(
    @Payload() data: DeviceNotificationDto,
    @Ctx() ctx: MqttContext,
  ) {
    return this.mqttService.handleDeviceNotification(data);
  }

  @MessagePattern('device/connection/connected')
  async deviceConnected(
    @Payload() data: { device: string },
    @Ctx() ctx: MqttContext,
  ) {
    return this.mqttService.handleDeviceConnected(data);
  }

  @MessagePattern('device/authentication/success')
  async deviceAuthenticationSuccess(
    @Payload() data: { device: string },
    @Ctx() ctx: MqttContext,
  ) {
    return this.mqttService.handleDeviceAuthenticationSuccess(data);
  }

  @MessagePattern('device/authentication/failed')
  async deviceAuthenticationFailed(
    @Payload() data: { device: string },
    @Ctx() ctx: MqttContext,
  ) {
    return this.mqttService.handleDeviceAuthenticationFailed(data);
  }

  @MessagePattern('device/connection/lost')
  async deviceConnectionLost(
    @Payload() data: { device: string },
    @Ctx() ctx: MqttContext,
  ) {
    return this.mqttService.handleDeviceDisconnected(data);
  }

  @MessagePattern('device/connection/disconnected')
  async deviceDisconnected(
    @Payload() data: { device: string },
    @Ctx() ctx: MqttContext,
  ) {
    return this.mqttService.handleDeviceDisconnected(data);
  }
}
