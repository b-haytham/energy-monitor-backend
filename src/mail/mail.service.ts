import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { TriggeredAlertsDocument } from 'src/alerts/entities/triggered-alerts.entity';
import { ReportDocument } from 'src/reports/entities/report.entity';
import { UserDocument } from 'src/users/entities/user.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendConfirmMail(user: string, email: string, url: string) {
    return this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to Nice App! Confirm your Email',
      template: './confirmation',
      context: {
        name: user,
        url,
      },
    });
  }

  async sendForgotPassword(data: {
    token: string;
    user_id: string;
    email: string;
    name: string;
  }) {
    const base_url = this.configService.get('RESET_PASSWORD_URL');
    const url = `${base_url}?token=${data.token}&user=${data.user_id}`;
    return this.mailerService.sendMail({
      to: data.email,
      subject: 'Reset Password',
      template: './forgot-password',
      context: {
        token: data.token,
        url,
        name: data.name,
      },
    });
  }

  async sendReportDone(data: { users: string[]; report: ReportDocument }) {
    return this.mailerService.sendMail({
      to: data.users,
      subject: 'Report',
      template: './report-mail',
      context: {},
      attachments: [
        {
          path: join(__dirname, '..') + data.report.file.path,
          filename: 'report.pdf',
        },
      ],
    });
  }

  async sendTriggeredAlert(triggered_alert: TriggeredAlertsDocument) {
    return this.mailerService.sendMail({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      to: (triggered_alert.alert.user as UserDocument).email,
      subject: 'Alert',
      template: './triggered-alert',
      context: {
        triggered_alert,
      },
    });
  }
}
