import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { DataService } from 'src/data/data.service';
import { DeviceDocument } from 'src/devices/entities/device.entity';
import { ReportFile, ReportItem } from 'src/reports/entities/report.entity';
import { ReportsService } from 'src/reports/reports.service';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';

import { readFileSync } from 'fs';
import { join } from 'path';
import { compile as compileTemplate } from 'handlebars';

import * as puppeteer from 'puppeteer';
import { DeviceNotificationDto } from 'src/mqtt/dto/DeviceNotification.dto';
import { AlertsService } from 'src/alerts/alerts.service';
import {
  AlertCondition,
  AlertDocument,
} from 'src/alerts/entities/alert.entity';
import { CreateTriggeredAlertDto } from 'src/alerts/dto/create-triggered-alert.dto';
import { UserDocument } from 'src/users/entities/user.entity';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private dataService: DataService,
    private reportsService: ReportsService,
    private alertsService: AlertsService,
    private wsGateway: WebsocketGateway,
    @InjectQueue('mail') private mailQueue: Queue,
  ) {}

  async generateReport(subscription: SubscriptionDocument) {
    this.logger.debug(subscription._id);
    const devices = subscription.devices as DeviceDocument[];

    const admin = subscription.admin as UserDocument;
    const users = subscription.users as UserDocument[];

    const promises = devices.map((device) =>
      this.dataService._energieConsumptionAggregation(device._id, '1m', true),
    );

    const result = await Promise.all(promises);

    let total = 0;

    const items: ReportItem[] = result.map((res, idx) => {
      const device = devices[idx];
      const data = res.slice(-1)[0] ?? null;

      if (data) {
        total += data.consumed;
      }

      return {
        device: device._id,
        device_name: device.name,
        consumed: data ? data.consumed : 0,
        cost: 0,
      };
    });

    const report = await this.reportsService.create({
      subscription: subscription._id,
      items,
      total,
      cost: 0,
      pdf_path: 'no-path',
      date: new Date(Date.now()),
    });

    const template_path = join(
      __dirname,
      '..',
      'assets',
      'templates',
      'report.hbs',
    );

    const html = this.compileTemplate(template_path, {
      total: report.total.toFixed(2),
      cost: report.cost.toFixed(2),
      items: report.items,
      subscription: subscription.company_info,
    });

    const pdf_name = `report-${Date.now()}.pdf`;
    const pdf_path = join(__dirname, '..', 'assets', pdf_name);
    const stylessheet_path = join(
      __dirname,
      '..',
      'assets',
      'css',
      'report.css',
    );

    try {
      await this.createPdf({ html, output_path: pdf_path, stylessheet_path });
    } catch (error) {
      this.logger.error(error);
    }

    const report_file: ReportFile = {
      name: pdf_name,
      path: `/assets/${pdf_name}`,
      url: `/reports/file/${pdf_name}`,
    };

    report.file = report_file;

    await report.save();

    await this.mailQueue.add('report-notify', {
      report,
      users: [admin.email, ...users.map((u) => u.email)],
    });
    this.wsGateway.server
      .to(['admin', subscription._id.toString()])
      .emit('report/generated', report);
    return report;
  }

  async processNotification(data: {
    device: DeviceDocument;
    notification: DeviceNotificationDto;
  }) {
    this.logger.log('Handling notification');
    const alerts = await this.alertsService
      ._findByDevice(data.notification.d)
      .populate(['user', 'device']);

    for (const alert of alerts) {
      this.logger.debug(alert._id);
      if (this.checkAlertCondition(alert, data.notification)) {
        const triggeredAlert = await this.alertsService.createTriggeredAlert(
          new CreateTriggeredAlertDto({
            alert: alert._id,
            value: data.notification.p[alert.value_name],
          }),
        );

        // populate user field in triggered alert
        (triggeredAlert.alert as AlertDocument).user = alert.user;

        this.logger.debug(
          `userId >> ${(alert.user as UserDocument)._id.toString()}`,
        );

        await this.mailQueue.add('alert-triggered', { alert: triggeredAlert });
        this.wsGateway.server
          .to(['admin', (alert.user as UserDocument)._id.toString()])
          .emit('alert/triggered', triggeredAlert);
      }
    }
  }

  private checkAlertCondition(
    alert: AlertDocument,
    notification: DeviceNotificationDto,
  ) {
    const alert_target_value = alert.value_name;
    switch (alert.if.condition) {
      case AlertCondition.GREATER_THAN:
        if (alert_target_value in notification.p) {
          this.logger.debug(
            `${notification.p[alert_target_value]} > ${alert.if.value}`,
          );
          return notification.p[alert_target_value] > alert.if.value;
        }
        return false;

      case AlertCondition.LESS_THAN:
        if (alert_target_value in notification.p) {
          this.logger.debug(
            `${notification.p[alert_target_value]} < ${alert.if.value}`,
          );
          return notification.p[alert_target_value] < alert.if.value;
        }
        return false;

      case AlertCondition.EQUALS:
        if (alert_target_value in notification.p) {
          this.logger.debug(
            `${notification.p[alert_target_value]} === ${alert.if.value}`,
          );
          return notification.p[alert_target_value] === alert.if.value;
        }
        return false;

      default:
        return false;
    }
  }

  private compileTemplate(path: string, data: any) {
    const template = readFileSync(path);
    const compiled = compileTemplate(template.toString('utf8'));
    return compiled(data);
  }

  private async createPdf(data: {
    html: string;
    output_path: string;
    stylessheet_path?: string;
  }) {
    const br = await puppeteer.launch({ headless: true });
    const page = await br.newPage();
    await page.setContent(data.html);
    // todo add style tag

    if (data.stylessheet_path) {
      await page.addStyleTag({ path: data.stylessheet_path });
    }

    await page.pdf({
      format: 'a4',
      path: data.output_path,
      pageRanges: '1',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: 20,
        right: 20,
        left: 20,
      },
    });

    await br.close();
  }
}
