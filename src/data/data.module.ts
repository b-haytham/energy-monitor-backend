import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { DataController } from './data.controller';
import { AggregationUtilitiesService } from './aggregation-utilities.service';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [DataController],
  providers: [DataService, AggregationUtilitiesService],
})
export class DataModule {}
