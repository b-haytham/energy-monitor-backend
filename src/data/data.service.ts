import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from 'src/storage/storage.service';
import { AggregationUtilitiesService } from './aggregation-utilities.service';
import { QueryEnergyDto } from './dto/query-energy.dto';
import { QueryPowerDto } from './dto/query-power.dto';

import * as dayjs from 'dayjs';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

  constructor(
    private aggregationUtils: AggregationUtilitiesService,
    private storageService: StorageService,
  ) {}

  async powerConsumption(query: QueryEnergyDto) {
    const match = this.aggregationUtils.getMatchStage(query.t, {
      's.d': query.d,
      's.v': 'e',
    });
    const group = this.aggregationUtils.getGroupStage(query.t, {
      max: { $last: '$v' },
    });

    const windowStage = this.aggregationUtils.getWindowingStage();

    const addFields = this.aggregationUtils.getAddFieldsStage();

    const pipeline = [match, group, windowStage, addFields];

    const StorageModel = this.storageService.getStorageModel();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    return StorageModel.aggregate(pipeline);
  }

  async power(query: QueryPowerDto) {
    const StorageModel = this.storageService.getStorageModel();
    return StorageModel.find({
      's.d': query.d,
      's.v': 'p',
      t: { $gte: dayjs().subtract(2, 'day').toDate() },
    }).sort({ t: 1 });
  }
}
