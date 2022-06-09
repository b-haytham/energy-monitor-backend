import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device, DeviceDocument } from './entities/device.entity';

import * as mongoose from 'mongoose';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import valuesSeed from './seed';
import { QueryDevicesDto } from './dto/query-devices.dto';
import { FindOptions } from 'src/utils/FindOptions';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(
    @InjectModel(Device.name)
    private DeviceModel: mongoose.Model<DeviceDocument>,
    @InjectConnection()
    private connection: mongoose.Connection,

    private subscriptionService: SubscriptionsService,
  ) {}

  async create(createDeviceDto: CreateDeviceDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const subscription = await this.subscriptionService.findById(
        createDeviceDto.subscription,
        {},
      );
      if (!subscription) {
        this.logger.error('[Create Device]: Subscription Not Found');
        throw new BadRequestException('Subscription does not exist');
      }

      const device = new this.DeviceModel({
        ...createDeviceDto,
        subscription: subscription._id,
        values: valuesSeed(createDeviceDto.type),
      });

      await device.save({ session });
      subscription.devices.push(device._id);
      await subscription.save({ session });

      await session.commitTransaction();
      await session.endSession();
      return device;
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  }

  findAll(query: QueryDevicesDto, options?: FindOptions) {
    const devices = this.DeviceModel.find();
    if (query && query.p) {
      const populate = query.p.split(',');
      devices.populate(populate);
    }
    if (options && options.req && options.req.user.subscription) {
      devices.where('subscription').equals(options.req.user.subscription);
    }
    if (options && options.session) {
      devices.session(options.session);
    }
    return devices.sort({ createdAt: -1 });
  }

  findById(id: string, query: QueryDevicesDto, options?: FindOptions) {
    const device = this.DeviceModel.findById(id);

    if (query && query.p) {
      const populate = query.p.split(',');
      device.populate(populate);
    }
    if (options && options.req && options.req.user.subscription) {
      device.where('subscription').equals(options.req.user.subscription);
    }
    if (options && options.session) {
      device.session(options.session);
    }

    return device;
  }

  _findById(id: string) {
    return this.DeviceModel.findById(id);
  }

  update(id: string, updateDeviceDto: UpdateDeviceDto) {
    return `This action updates a #${id} device`;
  }

  remove(id: string) {
    return `This action removes a #${id} device`;
  }
}
