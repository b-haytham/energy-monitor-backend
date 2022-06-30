import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { Queue } from 'bull';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { UserDocument } from 'src/users/entities/user.entity';

@Injectable()
export class ReportsScheduleService {
  private readonly logger = new Logger(ReportsScheduleService.name);

  constructor(
    private subscriptionsService: SubscriptionsService,
    @InjectQueue('reports') private reportsQueue: Queue,
  ) {}

  // @Cron('0 0 1 * *', {
  //   name: 'reports-task',
  //   timeZone: 'Africa/Tunis'
  // })
  @Interval(20000)
  async generateReports() {
    const subscriptions = await this.subscriptionsService
      ._findAll()
      .populate(['admin', 'users', 'devices']);

    // if (subscriptions.length > 0) {
    //   await this.reportsQueue.addBulk(
    //     subscriptions.map((sub) => ({ name: 'reports', data: sub })),
    //   );
    // }
  }
}
