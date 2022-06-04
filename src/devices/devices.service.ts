import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device, DeviceDocument } from './entities/device.entity';

import * as mongoose from 'mongoose';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import valuesSeed from './seed';

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

  findAll() {
    return this.DeviceModel.find();
  }

  findById(id: string) {
    return this.DeviceModel.findById(id);
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
