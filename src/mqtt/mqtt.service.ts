import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { DevicesService } from 'src/devices/devices.service';
import { StorageService } from 'src/storage/storage.service';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { DeviceNotificationDto } from './dto/DeviceNotification.dto';

@Injectable()
export class MqttService {
  private readonly logger = new Logger(MqttService.name);

  constructor(
    private storageService: StorageService,
    private websocketGateway: WebsocketGateway,
    private devicesService: DevicesService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  async handleDeviceNotification(data: DeviceNotificationDto) {
    // performance.mark('start');
    const device = await this.storageService.store(data);
    this.logger.log(`device new values stored: ${device ? device._id : 'No'}`);
    if (device) {
      this.websocketGateway.server
        .to(['admin', device.subscription.toString() as string])
        .emit(`notification/${device._id}`, data);

      this.websocketGateway.server
        .to(['admin', device.subscription.toString() as string])
        .emit(`device/notification`, data);
    }

    await this.notificationsQueue.add('notification', {
      device,
      notification: data,
    });
  }

  async handleDeviceConnected(data: { device: string }) {
    this.logger.debug(`Device connected: ${data.device}`);
    this.websocketGateway.server
      .to(['admin'])
      .emit('device/connection/connected', {
        device: data.device,
        timestamp: new Date(Date.now()),
      });
  }

  async handleDeviceAuthenticationSuccess(data: { device: string }) {
    this.logger.debug(`Device authentication success: ${data.device}`);
    const device = await this.devicesService._findById(data.device);
    if (device) {
      this.websocketGateway.server
        .to(['admin', device.subscription.toString()])
        .emit('device/authentication/success', {
          device: data.device,
          timestamp: new Date(Date.now()),
        });
    }
  }

  async handleDeviceAuthenticationFailed(data: { device: string }) {
    this.logger.debug(`Device authentication failed: ${data.device}`);
    const device = await this.devicesService._findById(data.device);
    this.websocketGateway.server
      .to(device ? ['admin', device.subscription.toString()] : ['admin'])
      .emit('device/authentication/failed', {
        device: data.device,
        timestamp: new Date(Date.now()),
      });
  }

  async handleDeviceConnectionLost(data: { device: string }) {
    this.logger.debug(`Device connection lost: ${data.device}`);
    const device = await this.devicesService._findById(data.device);
    this.websocketGateway.server
      .to(device ? ['admin', device.subscription.toString()] : ['admin'])
      .emit('device/connection/lost', {
        device: data.device,
        timestamp: new Date(Date.now()),
      });
  }

  async handleDeviceDisconnected(data: { device: string }) {
    this.logger.debug(`Device disconnected: ${data.device}`);
    const device = await this.devicesService._findById(data.device);
    this.websocketGateway.server
      .to(device ? ['admin', device.subscription.toString()] : ['admin'])
      .emit('device/connection/disconnected', {
        device: data.device,
        timestamp: new Date(Date.now()),
      });
  }
}
