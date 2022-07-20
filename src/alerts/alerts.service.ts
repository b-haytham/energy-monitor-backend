import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { Alert, AlertDocument } from './entities/alert.entity';

import * as mongoose from 'mongoose';
import { FindOptions, ReqOptions } from 'src/utils/FindOptions';
import { DevicesService } from 'src/devices/devices.service';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';
import {
  TriggeredAlerts,
  TriggeredAlertsDocument,
} from './entities/triggered-alerts.entity';
import { CreateTriggeredAlertDto } from './dto/create-triggered-alert.dto';
import { validate } from 'class-validator';
import { UserDocument } from 'src/users/entities/user.entity';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectModel(Alert.name) private AlertModel: mongoose.Model<AlertDocument>,
    @InjectModel(TriggeredAlerts.name)
    private TriggeredAlertModel: mongoose.Model<TriggeredAlertsDocument>,
    private devicesSerivce: DevicesService,
  ) {}

  async create(createAlertDto: CreateAlertDto, options?: ReqOptions) {
    if (!options) {
      this.logger.error(
        '[Create]: No Request passed to service: "Probably unauthenticated"',
      );
      throw new ForbiddenException();
    }

    const loggedInUser = options.req.user;

    const device = await this.devicesSerivce._findById(createAlertDto.device);
    if (!device) {
      throw new BadRequestException('Device Not Exist');
    }

    if (loggedInUser.role.includes('user')) {
      if (
        device.subscription.toString() !==
        (loggedInUser.subscription as SubscriptionDocument)._id.toString()
      ) {
        throw new ForbiddenException();
      }
    }

    const value_name = device.values.find(
      (val) => val.accessor == createAlertDto.value_name,
    );
    if (!value_name) {
      throw new BadRequestException('Invalid value name');
    }

    const alert = new this.AlertModel({
      user: loggedInUser._id,
      ...createAlertDto,
    });

    await alert.save();
    return alert.populate(['user', 'device']);
  }

  async createTriggeredAlert(createTriggeredAlertDto: CreateTriggeredAlertDto) {
    const errors = await validate(this.createTriggeredAlert);
    if (errors.length > 0) {
      this.logger.error(errors);
      return;
    }

    const triggeredAlert = new this.TriggeredAlertModel(
      createTriggeredAlertDto,
    );
    await triggeredAlert.save();
    return triggeredAlert.populate(['alert']);
  }

  async findAllTrigggeredAlerts(id: string, options: ReqOptions) {
    const alert = await this._findById(id).populate(['user', 'device']);

    if (!alert) {
      throw new NotFoundException('Alert Not found');
    }

    const loggedInUser = options.req.user;
    if (
      loggedInUser.role.includes('user') &&
      (alert.user as UserDocument)._id.toString() !==
        loggedInUser._id.toString()
    ) {
      throw new ForbiddenException();
    }

    const triggeredAlerts = await this.TriggeredAlertModel.find({
      alert: alert._id,
    }).populate(['alert']).sort({ createdAt: -1 });

    return { alert, triggeredAlerts };
  }

  findAll(options?: FindOptions) {
    const alerts = this._findAll();
    if (!options) {
      this.logger.error(
        '[Create]: No Request passed to service: "Probably unauthenticated"',
      );
      throw new ForbiddenException();
    }
    const loggedInUser = options.req.user;
    if (loggedInUser.role.includes('user')) {
      alerts.where('user', loggedInUser._id);
    }

    return alerts.populate(['user', 'device']);
  }

  _findAll() {
    return this.AlertModel.find({}).sort({ createdAt: -1 });
  }

  async findById(id: string, options?: FindOptions) {
    const alert = this._findById(id);
    if (!options) {
      this.logger.error(
        '[Create]: No Request passed to service: "Probably unauthenticated"',
      );
      throw new ForbiddenException();
    }
    const loggedInUser = options.req.user;
    if (loggedInUser.role.includes('user')) {
      alert.where('user', loggedInUser._id);
    }
    return alert.populate(['user', 'device']);
  }

  _findById(id: string) {
    return this.AlertModel.findById(id);
  }

  _findByDevice(device: string) {
    return this.AlertModel.find({ device });
  }

  async update(
    id: string,
    updateAlertDto: UpdateAlertDto,
    options: ReqOptions,
  ) {
    const alert = await this.findById(id, options);
    if (!alert) {
      this.logger.error('[Update]: Alert not found');
      throw new NotFoundException('Alert Not Found');
    }
    alert.set(updateAlertDto);
    await alert.save();
    return alert.populate(['user', 'device']);
  }

  async remove(id: string, options: ReqOptions) {
    const alert = await this.findById(id, options);
    if (!alert) {
      this.logger.error('[Remove]: Alert not found');
      throw new NotFoundException('Alert Not Found');
    }
    await alert.delete();
    return alert;
  }
}
