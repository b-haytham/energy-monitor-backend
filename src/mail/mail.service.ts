import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AlertDocument } from 'src/alerts/entities/alert.entity';
import { TriggeredAlertsDocument } from 'src/alerts/entities/triggered-alerts.entity';
import { DeviceDocument } from 'src/devices/entities/device.entity';
import { ReportDocument } from 'src/reports/entities/report.entity';
import { UserDocument } from 'src/users/entities/user.entity';

export type SendForgotPasswordData = {
  token: string;
  user: UserDocument;
};

export type SendReportDoneData = {
  report: ReportDocument;
  users: UserDocument[];
};

export type SendTriggeredAlertData = {
  triggered_alert: TriggeredAlertsDocument;
  user: UserDocument;
  alert: AlertDocument;
};

export type SendDeviceConnectedData = {
  device: DeviceDocument;
  users: UserDocument[];
};

export type SendDeviceConnectionLostData = SendDeviceConnectedData;
export type SendDeviceDisconnectedData = SendDeviceConnectedData;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendConfirmMail(user: string, email: string, url: string) {
    if (!this.checkMailConfig()) {
      this.logger.error('No smtp configuration');
      return;
    }
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
    if (!this.checkMailConfig()) {
      this.logger.error('No smtp configuration');
      return;
    }

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

  async sendReportDone(data: SendReportDoneData) {
    if (!this.checkMailConfig()) {
      this.logger.error('No smtp configuration');
      return;
    }

    const client_url = this.configService.get<string>('CLIENT_URL');
    const date = new Date(data.report.date);
    return this.mailerService.sendMail({
      to: data.users.map((u) => u.email),
      subject: 'New Report',
      template: './report-mail',
      context: {
        report: {
          ...data.report,
          date: date.getFullYear() + '-' + date.getMonth(),
        },
        base_url: client_url,
      },
      attachments: [
        {
          path: join(__dirname, '..') + data.report.file.path,
          filename: 'report.pdf',
        },
      ],
    });
  }

  async sendTriggeredAlert(data: SendTriggeredAlertData) {
    if (!this.checkMailConfig()) {
      this.logger.error('No smtp configuration');
      return;
    }

    const client_url = this.configService.get<string>('CLIENT_URL');
    return this.mailerService.sendMail({
      to: data.user.email,
      subject: 'Triggered Alert',
      template: './triggered-alert',
      context: {
        triggered_alert: data.triggered_alert,
        user: data.user,
        alert: data.alert,
        base_url: client_url,
      },
    });
  }

  async sendDeviceConnected(data: SendDeviceConnectedData) {
    if (!this.checkMailConfig()) {
      this.logger.error('No smtp configuration');
      return;
    }

    const client_url = this.configService.get<string>('CLIENT_URL');

    const promises = data.users.map((user) => {
      return this.mailerService.sendMail({
        to: user.email,
        subject: 'Device Connected',
        template: './device-connected',
        context: {
          device: data.device,
          user,
          base_url: client_url,
        },
      });
    });

    return Promise.all(promises);
  }

  async sendDeviceConnectionLost(data: SendDeviceConnectionLostData) {
    if (!this.checkMailConfig()) {
      this.logger.error('No smtp configuration');
      return;
    }

    const client_url = this.configService.get<string>('CLIENT_URL');

    const promises = data.users.map((user) => {
      return this.mailerService.sendMail({
        to: user.email,
        subject: 'Device Connection Lost',
        template: './device-connection-lost',
        context: {
          device: data.device,
          user,
          base_url: client_url,
        },
      });
    });

    return Promise.all(promises);
  }

  async sendDeviceDisconnected(data: SendDeviceDisconnectedData) {
    if (!this.checkMailConfig()) {
      this.logger.error('No smtp configuration');
      return;
    }

    const client_url = this.configService.get<string>('CLIENT_URL');

    const promises = data.users.map((user) => {
      return this.mailerService.sendMail({
        to: user.email,
        subject: 'Device Disconnected',
        template: './device-disconnected',
        context: {
          device: data.device,
          user,
          base_url: client_url,
        },
      });
    });

    return Promise.all(promises);
  }

  private checkMailConfig(): boolean {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<string>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const password = this.configService.get<string>('SMTP_PASSWORD');

    if (!host || !port || !user || !password) return false;

    return true;
  }
}
