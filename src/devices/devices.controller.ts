import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ValidationPipe,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  create(@Body(ValidationPipe) createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  findAll() {
    return this.devicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.devicesService.findById(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDeviceDto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}
