import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from 'src/users/entities/user.entity';
import { DataService } from './data.service';
import { QueryEnergyDto } from './dto/query-energy.dto';
import { QueryPowerDto } from './dto/query-power.dto';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.USER,
    UserRole.SUPER_USER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Get('energy')
  getPowerConsumption(
    @Query(ValidationPipe) query: QueryEnergyDto,
    @Req() request: Request,
  ) {
    return this.dataService.powerConsumption(query, { req: request });
  }

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.USER,
    UserRole.SUPER_USER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Get('power')
  getPower(
    @Query(ValidationPipe) query: QueryPowerDto,
    @Req() request: Request,
  ) {
    return this.dataService.power(query, { req: request });
  }
}
