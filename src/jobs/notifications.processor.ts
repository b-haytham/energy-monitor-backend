import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { JobsService } from './jobs.service';

@Processor('notifications')
export class NotificationsProcessor {
  constructor(private jobsService: JobsService) {}

  @Process('notification')
  async processNotification(job: Job) {
    this.jobsService.processNotification(job.data);
  }
}
