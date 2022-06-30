import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailService } from 'src/mail/mail.service';

@Processor('mail')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private mailService: MailService) {}

  @Process('confirm')
  async confirm(job: Job) {
    this.logger.log(`Processing confirm mail job`);
    try {
      await this.mailService.sendConfirmMail(
        'haytham',
        'haytham@gmail.com',
        'https://google.com',
      );
      this.logger.debug('Email Sent');
    } catch (error) {
      this.logger.error(error);
    }
  }

  @Process('forgot-password')
  async processForgotPassword(job: Job) {
    this.logger.log(
      `Processing forgot password mail job for ${job.data.email}`,
    );
    try {
      await this.mailService.sendForgotPassword({
        email: job.data.email,
        user_id: job.data.user_id,
        token: job.data.token,
        name: job.data.name,
      });
      this.logger.log('Forgot Password Email Sent');
    } catch (error) {
      this.logger.error(error);
    }
  }

  @Process('report-done')
  async processReportDone(job: Job) {
    try {
      await this.mailService.sendReportDone({
        users: job.data.users,
        report: job.data.report,
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
