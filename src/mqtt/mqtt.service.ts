import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { performance, PerformanceObserver } from 'perf_hooks';
import { StorageService } from 'src/storage/storage.service';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { DeviceNotificationDto } from './dto/DeviceNotification.dto';

@Injectable()
export class MqttService {
  private readonly logger = new Logger(MqttService.name);

  private perfObserver: PerformanceObserver;

  constructor(
    private storageService: StorageService,
    private websocketGateway: WebsocketGateway,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {
    // this.initPerf();
  }

  initPerf() {
    this.perfObserver = new PerformanceObserver((items) => {
      items.getEntries().forEach((item) => console.log(item));
    });
    this.perfObserver.observe({ entryTypes: ['measure'], buffered: true });
  }

  async handleDeviceNotification(data: DeviceNotificationDto) {
    // performance.mark('start');
    const device = await this.storageService.store(data);
    if (device) {
      this.websocketGateway.server
        .to(['admin', device.subscription as string])
        .emit(`notification/${device._id}`, data);

      this.websocketGateway.server
        .to(['admin', device.subscription as string])
        .emit(`device/notification`, data);
    }

    await this.notificationsQueue.add('notification', {
      device,
      notification: data,
    });

    // performance.mark('end');
    // performance.measure('storage', 'start', 'end');
  }
}
