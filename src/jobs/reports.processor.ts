import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';
import { JobsService } from './jobs.service';

@Processor('reports')
export class ReportsProcessor {
  constructor(private jobsService: JobsService) {}

  @Process('report-generate')
  async processReport(job: Job) {
    const subscription = job.data as SubscriptionDocument;
    return this.jobsService.generateReport(subscription);
  }
}
