import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Storage, StorageDocument } from './entities/storage.entity';

import * as mongoose from 'mongoose';
import { DeviceNotificationDto } from 'src/mqtt/dto/DeviceNotification.dto';
import { DevicesService } from 'src/devices/devices.service';
import { performance, PerformanceObserver } from 'perf_hooks';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  private perfObserver: PerformanceObserver;

  constructor(
    @InjectModel(Storage.name)
    private StorageModel: mongoose.Model<StorageDocument>,
    private devicesService: DevicesService,
  ) {
    this.initPerf();
  }

  initPerf() {
    this.perfObserver = new PerformanceObserver((items) => {
      items.getEntries().forEach((item) => console.log(item));
    });
    this.perfObserver.observe({ entryTypes: ['measure'], buffered: true });
  }

  async store(data: DeviceNotificationDto) {
    const device = await this.devicesService._findById(data.d);
    this.logger.log(`Storing data for device ${device.name}`);

    if (device) {
      const newValues = device.values.map((val) => {
        if (val.accessor in data.p) {
          return {
            ...val,
            latest_value: {
              value: data.p[val.accessor],
              timestamp: data.t,
            },
          };
        } else {
          return val;
        }
      });

      device.values = newValues;
      device.power = data.p.p;
      device.energie = data.p.e;

      const savePromise = device.save();
      const storagePromise = this.StorageModel.create([
        {
          s: {
            s: device.subscription,
            d: device._id,
            v: 'e',
          },
          v: data.p['e'],
          t: data.t,
        },
        {
          s: {
            s: device.subscription,
            d: device._id,
            v: 'p',
          },
          v: data.p['p'],
          t: data.t,
        },
      ]);

      performance.mark('start');
      const result = await Promise.allSettled([savePromise, storagePromise]);
      performance.mark('end');
      performance.measure('insert', 'start', 'end');
      this.logger.debug(JSON.stringify(result.map((res) => res.status)));
    }
  }
}
