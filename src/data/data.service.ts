import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { StorageService } from 'src/storage/storage.service';
import { AggregationUtilitiesService } from './aggregation-utilities.service';
import { QueryEnergyDto } from './dto/query-energy.dto';
import { QueryPowerDto } from './dto/query-power.dto';

import * as mongoose from 'mongoose';
import * as dayjs from 'dayjs';

import { DevicesService } from 'src/devices/devices.service';
import { FindOptions } from 'src/utils/FindOptions';
import { DeviceDocument } from 'src/devices/entities/device.entity';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

  constructor(
    private aggregationUtils: AggregationUtilitiesService,
    private storageService: StorageService,
    private devicesService: DevicesService,
  ) {}

  private checkIsAuthorized<T extends { s: string; d: string }>(
    device: DeviceDocument,
    query: T,
    findOptions?: FindOptions,
  ) {
    if (device.subscription.toString() !== query.s) {
      this.logger.error(
        `Device ${query.d} with subscription ${query.s} not found`,
      );
      throw new BadRequestException('Invalid subscription for provided device');
    }

    if (
      findOptions &&
      findOptions.req &&
      findOptions.req.user &&
      findOptions.req.user.role.includes('user') &&
      findOptions.req.user.subscription &&
      (
        findOptions.req.user.subscription as SubscriptionDocument
      )._id.toString() !== query.s
    ) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        `${findOptions.req.user.subscription._id} == ${query.s}`,
      );
      this.logger.error(`user unauthorized`);
      throw new ForbiddenException();
    }
  }

  async powerConsumption(query: QueryEnergyDto, options?: FindOptions) {
    const device = await this.devicesService._findById(query.d);
    if (!device) {
      this.logger.error(`Device ${query.d} not found`);
      throw new BadRequestException('Device not found');
    }
    this.logger.debug(options.req.user);

    this.checkIsAuthorized(device, query, options);
    return this._energieConsumptionAggregation(device._id, query.t);
  }

  async power(query: QueryPowerDto, options?: FindOptions) {
    const device = await this.devicesService._findById(query.d);
    if (!device) {
      this.logger.error(`Device ${query.d} not found`);
      throw new BadRequestException('Device not found');
    }

    this.checkIsAuthorized(device, query, options);

    const StorageModel = this.storageService.getStorageModel();
    return StorageModel.find({
      's.d': query.d,
      's.v': 'p',
      t: { $gte: dayjs().subtract(1, 'minute').toDate() },
    }).sort({ t: 1 });
  }

  async energieOverview(query: QueryEnergyDto, options?: FindOptions) {
    const device = await this.devicesService._findById(query.d);
    if (!device) {
      this.logger.error(`Device ${query.d} not found`);
      throw new BadRequestException('Device not found');
    }
    this.logger.debug(options.req.user);

    this.checkIsAuthorized(device, query, options);

    const match = this.aggregationUtils.getMatchStage(query.t, {
      's.d': device._id,
      's.v': 'e',
    });
    const group = this.aggregationUtils.getGroupStage(
      query.t,
      {
        max: { $last: '$v' },
      },
      true,
    );

    const windowStage = this.aggregationUtils.getWindowingStage();

    const addFields = this.aggregationUtils.getAddFieldsStage();

    const pipeline = [match, group, windowStage, addFields];

    const StorageModel = this.storageService.getStorageModel();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    // return StorageModel.aggregate(pipeline);

    return this._energieConsumptionAggregation(device._id, query.t, true);
  }

  _energieConsumptionAggregation(
    device: string | mongoose.ObjectId,
    time: string,
    isExactTime?: boolean,
  ) {
    const deviceId =
      typeof device === 'string' ? new mongoose.Types.ObjectId(device) : device;

    const match = this.aggregationUtils.getMatchStage(time, {
      's.d': deviceId,
      's.v': 'e',
    });
    const group = this.aggregationUtils.getGroupStage(
      time,
      {
        max: { $last: '$v' },
      },
      isExactTime ? true : false,
    );

    const windowStage = this.aggregationUtils.getWindowingStage();

    const addFields = this.aggregationUtils.getAddFieldsStage();

    const pipeline = [match, group, windowStage, addFields];

    const StorageModel = this.storageService.getStorageModel();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    // return StorageModel.aggregate(pipeline);
    return StorageModel.aggregate(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      // eslint-disable-next-line prettier/prettier
      this.aggregationUtils.getAggregationPipeline(deviceId, 'p', time, isExactTime),
      { allowDiskUse: true },
    );
  }
}
