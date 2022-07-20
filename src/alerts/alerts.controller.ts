import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
  Req,
  Put,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from 'src/users/entities/user.entity';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.USER,
    UserRole.SUPER_USER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Post()
  create(
    @Body(ValidationPipe) createAlertDto: CreateAlertDto,
    @Req() request: Request,
  ) {
    return this.alertsService.create(createAlertDto, { req: request });
  }

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.USER,
    UserRole.SUPER_USER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Get()
  findAll(@Req() request: Request) {
    return this.alertsService.findAll({ req: request });
  }

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.USER,
    UserRole.SUPER_USER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Get(':id/triggered')
  findAllTriggeredAlerts(@Param('id') id: string, @Req() request: Request) {
    return this.alertsService.findAllTrigggeredAlerts(id, { req: request });
  }

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.USER,
    UserRole.SUPER_USER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    return this.alertsService.findById(id, { req: request });
  }

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.USER,
    UserRole.SUPER_USER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateAlertDto: UpdateAlertDto,
    @Req() request: Request,
  ) {
    return this.alertsService.update(id, updateAlertDto, { req: request });
  }

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.USER,
    UserRole.SUPER_USER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    return this.alertsService.remove(id, { req: request });
  }
}
