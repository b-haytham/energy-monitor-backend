import { Injectable, Logger } from '@nestjs/common';
import { performance, PerformanceObserver } from 'perf_hooks';
import { StorageService } from 'src/storage/storage.service';
import { DeviceNotificationDto } from './dto/DeviceNotification.dto';

@Injectable()
export class MqttService {
  private readonly logger = new Logger(MqttService.name);

  private perfObserver: PerformanceObserver;

  constructor(private storageService: StorageService) {
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
    await this.storageService.store(data);
    // performance.mark('end');
    // performance.measure('storage', 'start', 'end');
  }
}
