import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Report, ReportDocument } from './entities/report.entity';

import * as mongoose from 'mongoose';
import { validate } from 'class-validator';
import { CreateReportDto } from './dto/create-report.dto';
import { TriggerReportDto } from './dto/trigger-report.dto';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectModel(Report.name)
    private ReportModel: mongoose.Model<ReportDocument>,
    private subscriptionsService: SubscriptionsService,
    @InjectQueue('reports') private reportsQueue: Queue,
  ) {}

  async create(createReportDto: CreateReportDto) {
    const errors = await validate(createReportDto);
    if (errors.length > 0) {
      this.logger.error(`Invalid data`);
      throw new BadRequestException('Invalid data suplied');
    }

    const report = new this.ReportModel(createReportDto);
    return report.save();
  }

  async triggerReport(triggerReportDto: TriggerReportDto) {
    const subscription = await this.subscriptionsService
      ._findById(triggerReportDto.subscription)
      .populate(['admin', 'users', 'devices']);

    if (!subscription) {
      throw new NotFoundException('Subscription Not Found');
    }

    await this.reportsQueue.add('reports', subscription);

    return subscription;
  }

  _findAll() {
    return this.ReportModel.find({}).sort({ createdAt: -1 });
  }

  _findById(id: string) {
    return this.ReportModel.findById(id);
  }
}
