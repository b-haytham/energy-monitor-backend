import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { DataController } from './data.controller';
import { AggregationUtilitiesService } from './aggregation-utilities.service';
import { StorageModule } from 'src/storage/storage.module';
import { DevicesModule } from 'src/devices/devices.module';

@Module({
  imports: [StorageModule, DevicesModule],
  controllers: [DataController],
  providers: [DataService, AggregationUtilitiesService],
  exports: [DataService],
})
export class DataModule {}
