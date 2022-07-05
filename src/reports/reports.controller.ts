import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from 'src/users/entities/user.entity';
import { TriggerReportDto } from './dto/trigger-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('trigger')
  trigger(@Body(ValidationPipe) triggerReportDto: TriggerReportDto) {
    return this.reportsService.triggerReport(triggerReportDto);
  }

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.SUPER_USER,
    UserRole.USER,
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
  )
  @Get('file/:name')
  downloadReport(
    @Param('name') name: string,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    return this.reportsService.downloadReport({ name, res, req });
  }

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.SUPER_USER,
    UserRole.USER,
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
  )
  @Get()
  findAll(@Req() req: Request) {
    return this.reportsService.findAll({ req });
  }

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.SUPER_USER,
    UserRole.USER,
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
  )
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.reportsService.findById(id, { req });
  }
}
