import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
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
import { Response, Request } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';
import { ReqOptions } from 'src/utils/FindOptions';

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

  async downloadReport({
    name,
    res,
    req,
  }: {
    name: string;
    res: Response;
    req: Request;
  }) {
    const report = await this.ReportModel.findOne({ 'file.name': name });
    if (!report) {
      throw new NotFoundException('Report file not found');
    }

    const loggedInUser = req.user;

    if (loggedInUser.role.includes('user') && !loggedInUser.subscription) {
      this.logger.error('[Download]: user without subscription');
      throw new ForbiddenException();
    }

    if (
      loggedInUser.role.includes('user') &&
      (loggedInUser.subscription as SubscriptionDocument)._id.toString() !==
        report.subscription.toString()
    ) {
      throw new ForbiddenException();
    }

    try {
      const file = createReadStream(join(__dirname, '..', 'assets', name));
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${name}"`,
      });
    return new StreamableFile(file);
    } catch (error) {
      this.logger.error(error);      
      throw error;
    }
  }

  async findAll(options: ReqOptions) {
    const loggedInUser = options.req.user;

    const reports = this._findAll();

    if (loggedInUser.role.includes('user')) {
      if (!loggedInUser.subscription) {
        throw new ForbiddenException();
      }

      const subscriptionId = (loggedInUser.subscription as SubscriptionDocument)
        ._id;

      reports.where('subscription', subscriptionId);
    }

    return reports.populate('subscription');
  }

  async findById(id: string, options: ReqOptions) {
    const loggedInUser = options.req.user;

    if (loggedInUser.role.includes('user') && !loggedInUser.subscription) {
      throw new ForbiddenException();
    }

    const report = await this._findById(id);

    const subscriptionId = (loggedInUser.subscription as SubscriptionDocument)
      ._id;

    if (
      loggedInUser.role.includes('user') &&
      report.subscription.toString() !== subscriptionId.toString()
    ) {
      throw new ForbiddenException();
    }

    return report.populate('subscription');
  }

  _findAll() {
    return this.ReportModel.find({}).sort({ createdAt: -1 });
  }

  _findById(id: string) {
    return this.ReportModel.findById(id);
  }
}
