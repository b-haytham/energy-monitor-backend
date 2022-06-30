import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { DataService } from 'src/data/data.service';
import { ReportsService } from 'src/reports/reports.service';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';
import { JobsService } from './jobs.service';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Processor('reports')
export class ReportsProcessor {
  private readonly logger = new Logger(ReportsProcessor.name);

  constructor(
    private dataService: DataService,
    private reportsService: ReportsService,
    private jobsService: JobsService,
    @InjectQueue('mail') private mailQueue: Queue,
  ) {}

  @Process('reports')
  async processReports(job: Job) {
    const report = await this.jobsService.generateReport(
      job.data as SubscriptionDocument,
    );

    const users = job.data.users.map((u) => u.email);
    this.logger.log(`Report generated: ${report}`);

    await this.mailQueue.add('report-done', { users, report });
  }
}
