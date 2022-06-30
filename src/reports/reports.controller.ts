import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { TriggerReportDto } from './dto/trigger-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('trigger')
  trigger(@Body(ValidationPipe) triggerReportDto: TriggerReportDto) {
    return this.reportsService.triggerReport(triggerReportDto);
  }

  @Get()
  findAll() {
    return this.reportsService._findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportsService._findById(id);
  }
}
