import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { DataService } from './data.service';
import { QueryEnergyDto } from './dto/query-energy.dto';
import { QueryPowerDto } from './dto/query-power.dto';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('energy')
  getPowerConsumption(@Query(ValidationPipe) query: QueryEnergyDto) {
    return this.dataService.powerConsumption(query);
  }

  @Get('power')
  getPower(@Query(ValidationPipe) query: QueryPowerDto) {
    return this.dataService.power(query);
  }
}
