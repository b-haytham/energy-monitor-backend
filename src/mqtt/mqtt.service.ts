import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { DevicesService } from 'src/devices/devices.service';
import { StorageService } from 'src/storage/storage.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { UserDocument } from 'src/users/entities/user.entity';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { DeviceNotificationDto } from './dto/DeviceNotification.dto';

@Injectable()
export class MqttService {
  private readonly logger = new Logger(MqttService.name);

  constructor(
    private storageService: StorageService,
    private websocketGateway: WebsocketGateway,
    private devicesService: DevicesService,
    private subscriptionsService: SubscriptionsService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectQueue('mail') private mailQueue: Queue,
  ) {}

  async handleDeviceNotification(data: DeviceNotificationDto) {
    // performance.mark('start');
    const device = await this.storageService.store(data);
    // this.logger.log(`device new values stored: ${device ? device._id : 'No'}`);
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
    this.logger.log(`Device connected message: ${data.device}`);
    const device = await this.devicesService._findById(data.device);
    this.websocketGateway.server
      .to(device ? ['admin', device.subscription.toString()] : ['admin'])
      .emit('device/connection/connected', {
        device: data.device,
        timestamp: new Date(Date.now()),
      });
  }

  async handleDeviceAuthenticationSuccess(data: { device: string }) {
    this.logger.log(`Device authentication success: ${data.device}`);
    const device = await this.devicesService._findById(data.device);
    if (!device) return;

    this.websocketGateway.server
      .to(['admin', device.subscription.toString()])
      .emit('device/authentication/success', {
        device: data.device,
        timestamp: new Date(Date.now()),
      });

    const subscription = await this.subscriptionsService
      ._findById(device.subscription as string)
      .populate(['admin', 'users']);
    if (!subscription) return;

    const admin = subscription.admin as UserDocument;
    const users = subscription.users as UserDocument[];
    // const users_mails = [admin.email, ...users.map((u) => u.email)];
    await this.mailQueue.add('device-connected', {
      device,
      users: [admin, ...users],
    });
  }

  async handleDeviceAuthenticationFailed(data: { device: string }) {
    this.logger.log(`Device authentication failed: ${data.device}`);
    const device = await this.devicesService._findById(data.device);
    this.websocketGateway.server
      .to(device ? ['admin', device.subscription.toString()] : ['admin'])
      .emit('device/authentication/failed', {
        device: data.device,
        timestamp: new Date(Date.now()),
      });
  }

  async handleDeviceConnectionLost(data: { device: string }) {
    this.logger.log(`Device connection lost: ${data.device}`);
    const device = await this.devicesService._findById(data.device);
    this.websocketGateway.server
      .to(device ? ['admin', device.subscription.toString()] : ['admin'])
      .emit('device/connection/lost', {
        device: data.device,
        timestamp: new Date(Date.now()),
      });

    if (!device) return;

    const subscription = await this.subscriptionsService
      ._findById(device.subscription as string)
      .populate(['admin', 'users']);

    if (!subscription) return;

    const admin = subscription.admin as UserDocument;
    const users = subscription.users as UserDocument[];
    // const users_mails = [admin.email, ...users.map((u) => u.email)];
    await this.mailQueue.add('device-connection-lost', {
      device,
      users: [admin, ...users],
    });
  }

  async handleDeviceDisconnected(data: { device: string }) {
    this.logger.log(`Device disconnected: ${data.device}`);
    const device = await this.devicesService._findById(data.device);
    this.websocketGateway.server
      .to(device ? ['admin', device.subscription.toString()] : ['admin'])
      .emit('device/connection/disconnected', {
        device: data.device,
        timestamp: new Date(Date.now()),
      });

    // if (device) {
    //   await this.mailQueue.add('device-disconnected', device);
    // }
    //
    if (!device) return;

    const subscription = await this.subscriptionsService
      ._findById(device.subscription as string)
      .populate(['admin', 'users']);

    if (!subscription) return;

    const admin = subscription.admin as UserDocument;
    const users = subscription.users as UserDocument[];
    // const users_mails = [admin.email, ...users.map((u) => u.email)];
    await this.mailQueue.add('device-disconnected', {
      device,
      users: [admin, ...users],
    });
  }
}
