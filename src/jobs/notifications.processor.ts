import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { JobsService } from './jobs.service';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private jobsService: JobsService,
    @InjectQueue('mail') private mailQueue: Queue,
  ) {}

  @Process('notification')
  async processReports(job: Job) {
    this.jobsService.processNotification(job.data);
  }
}
