import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { DataService } from 'src/data/data.service';
import { DeviceDocument } from 'src/devices/entities/device.entity';
import {
  ReportDocument,
  ReportFile,
  ReportItem,
} from 'src/reports/entities/report.entity';
import { ReportsService } from 'src/reports/reports.service';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';

import { writeFile } from 'fs/promises';
import { join } from 'path';

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
    // private subscriptionsSevice: SubscriptionsService,
    private wsGateway: WebsocketGateway,
    @InjectQueue('mail') private mailQueue: Queue,
  ) {}

  // todo: extract logic
  // use db transction
  // add documentation
  async generateReport(subscription: SubscriptionDocument) {
    this.logger.debug(`[Generate Report]: subscription: ${subscription._id}`);

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

      const consumed = data ? data.consumed : 0;
      return {
        device: device._id,
        device_name: device.name,
        consumed: +consumed.toFixed(2),
        cost: subscription.company_info.energie_cost
          ? subscription.company_info.energie_cost * +consumed.toFixed(2)
          : 0,
      };
    });

    const report = await this.reportsService.create({
      subscription: subscription._id,
      items,
      total: +total.toFixed(2),
      cost: subscription.company_info.energie_cost
        ? subscription.company_info.energie_cost * +total.toFixed(2)
        : 0,
      file: {
        name: null,
        path: null,
        url: null,
      },
      date: new Date(Date.now()),
    });

    const pdf_name = `report-${Date.now()}.pdf`;
    const pdf_path = join(__dirname, '..', 'assets', pdf_name);
    //----------
    try {
      const resp = await this.generatePdf({
        report,
        company_info: subscription.company_info,
        output_path: pdf_path,
      });
      this.logger.debug(`[Generate Pdf]: Success ${resp}`);
    } catch (error) {
      this.logger.error(`[Generate Pdf DEBUF]:  ${error.message}`);
    }
    //---------

    const report_file: ReportFile = {
      name: pdf_name,
      path: `/assets/${pdf_name}`,
      url: `/reports/file/${pdf_name}`,
    };

    report.file = report_file;

    await report.save();

    await this.mailQueue.add('report-notify', {
      report,
      users: [admin, ...users],
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
    this.logger.log('Process device notification');
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
        alert.trigger_count += 1;
        await alert.save();

        await this.mailQueue.add('alert-triggered', {
          triggered_alert: triggeredAlert,
          user: alert.user,
          alert: alert,
        });

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

  private async generatePdf({
    report,
    company_info,
    output_path,
  }: {
    report: ReportDocument;
    company_info: SubscriptionDocument['company_info'];
    output_path: string;
  }) {
    return new Promise(async (resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const logo_path = join(
        __dirname,
        '..',
        'assets',
        'images',
        'logo-text.png',
      );

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const PdfDocument = require('pdfkit-table');
      const doc = new PdfDocument({ size: 'A4', margin: 20 });

      // doc.pipe(createWriteStream(output_path));

      doc.image(logo_path, 20, 20, { width: 80 });

      doc.moveDown();
      doc.moveDown();
      doc.moveDown();

      doc.fontSize(12);

      doc.text(company_info.name);
      doc.moveDown();
      doc.text(company_info.email);
      doc.text(company_info.phone);
      doc.moveDown();
      doc.text(
        [
          company_info.address.street,
          company_info.address.city,
          company_info.address.zip,
          company_info.address.country,
        ].join(', '),
      );

      doc.moveDown();
      doc.moveDown();

      doc.fontSize(20);

      doc.text(
        `Report (${report.date.getFullYear() + '-' + report.date.getMonth()})`,
      );

      doc.moveDown();

      await this.createTable(report, company_info, doc);

      this.waitPdfDocEnd(doc)
        .then((buf: any) => {
          writeFile(output_path, buf)
            .then(() => resolve(output_path))
            .catch(reject);
        })
        .catch(reject);

      doc.end();
    });
  }

  private async waitPdfDocEnd(doc: any) {
    return new Promise((resolve, reject) => {
      const buffers: any[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
    });
  }

  private async createTable(
    report: ReportDocument,
    company_info: SubscriptionDocument['company_info'],
    doc: any,
  ) {
    const items = report.items.map((it) => ({
      device: it.device_name,
      consumed: it.consumed.toFixed(2) + ' kw/h',
      cost: it.cost.toFixed(2) + ` ${company_info.currency || ''}`,
    }));

    const total_row = {
      device: 'Total',
      consumed: report.total.toFixed(2) + ' kw/h',
      cost: report.cost.toFixed(2) + ` ${company_info.currency || ''}`,
    };

    // table
    const table = {
      headers: [
        { label: 'Device', property: 'device' },
        { label: 'Consumed', property: 'consumed' },
        { label: 'Cost', property: 'cost' },
      ],
      datas: [...items, total_row],
    };

    await doc.table(table, {
      padding: 50,
      // y: 100
      minRowHeight: 20,
      divider: {
        header: { disabled: false, width: 0.5, opacity: 0.5 },
        horizontal: { disabled: false, width: 0.5, opacity: 0.5 },
      },
      prepareHeader: () => doc.fontSize(12),
      prepareRow: () => doc.fontSize(10),
    });
  }
}
