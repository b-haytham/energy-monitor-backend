import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import {
  UpdateSubscriptionDto,
  UpdateSubscriptionInfoDto,
} from './dto/update-subscription.dto';
import {
  CompanyInfo,
  Subscription,
  SubscriptionDocument,
} from './entities/subscription.entity';

import * as mongoose from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';
import { FindOptions, ReqOptions } from 'src/utils/FindOptions';
import { UserDocument } from 'src/users/entities/user.entity';
import { DeviceDocument } from 'src/devices/entities/device.entity';
import path, { parse } from 'path';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectModel(Subscription.name)
    private SubscriptionModel: mongoose.Model<SubscriptionDocument>,
    @InjectConnection() private connection: mongoose.Connection,
    private usersService: UsersService,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // get admin
      const admin = await this.usersService.findById(
        createSubscriptionDto.admin,
        {},
      );
      if (!admin) {
        this.logger.error('[Create Subscription]: Admin Not Found');
        throw new BadRequestException('Admin does not have a subscription');
      }

      if (admin.subscription) {
        this.logger.error('[Create Subscription]: Admin Have Subscription');
        throw new BadRequestException('Admin Already have subscription');
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const company_info: CompanyInfo = {
        ...createSubscriptionDto.company_info,
        currency: null,
        energie_cost: null,
        logo: {
          filename: null,
          path: null,
        },
      };

      // create subscription
      const subscription = new this.SubscriptionModel({
        admin: admin._id,
        company_info,
      });

      await subscription.save({ session });

      admin.subscription = subscription._id;
      await admin.save({ session });

      await session.commitTransaction();
      await session.endSession();
      return subscription.populate(['admin', 'users']);
    } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  }

  findAll(query: QuerySubscriptionsDto, options?: FindOptions) {
    const subscriptions = this.SubscriptionModel.find();

    if (query && query.p) {
      const populate = query.p.split(',');
      subscriptions.populate(populate);
    }

    return subscriptions.populate(['admin', 'users']).sort({ createdAt: -1 });
  }

  _findAll() {
    return this.SubscriptionModel.find({});
  }

  findById(id: string, query: QuerySubscriptionsDto, options?: FindOptions) {
    const subscription = this.SubscriptionModel.findById(id);

    if (query && query.p) {
      const populate = query.p.split(',');
      subscription.populate(populate);
    }

    return subscription.populate(['admin', 'users']);
  }

  _findById(id: string) {
    return this.SubscriptionModel.findById(id);
  }

  findByAdmin(admin: string | mongoose.ObjectId) {
    return this.SubscriptionModel.findOne({ admin }).populate([
      'admin',
      'users',
    ]);
  }

  findByUser(user: string | mongoose.ObjectId) {
    return this.SubscriptionModel.find({ users: { $in: [user] } }).populate([
      'admin',
      'users',
    ]);
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    const subscription = await this.SubscriptionModel.findByIdAndUpdate(
      id,
      { $set: updateSubscriptionDto },
      { new: true },
    );
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription.populate(['admin', 'users']);
  }

  async updateSubscriptionInfo(
    id: string,
    updateSubscriptionInfoDto: UpdateSubscriptionInfoDto,
    options: ReqOptions,
  ) {
    const loggedInUser = options.req.user;

    if (loggedInUser.role.includes('user') && !loggedInUser.subscription) {
      throw new ForbiddenException();
    }

    const subscription = await this._findById(id);
    this.logger.debug('SUBSC >>', subscription);
    if (!subscription) {
      throw new NotFoundException('Subscription Not Found');
    }

    if (
      loggedInUser.role.includes('user') &&
      (loggedInUser.subscription as SubscriptionDocument)._id.toString() !==
        subscription._id.toString()
    ) {
      throw new ForbiddenException();
    }

    let parsed: any;
    if (updateSubscriptionInfoDto.logo) {
      const file_path = updateSubscriptionInfoDto.logo.path;

      parsed = parse(file_path);
      console.log(parsed);
    }

    const company_info: CompanyInfo = {
      name: updateSubscriptionInfoDto.name,
      email: updateSubscriptionInfoDto.email || subscription.company_info.email,
      phone: updateSubscriptionInfoDto.phone,
      address: updateSubscriptionInfoDto.address
        ? {
            ...subscription.company_info.address,
            ...updateSubscriptionInfoDto.address,
          }
        : subscription.company_info.address,
      logo: updateSubscriptionInfoDto.logo
        ? {
            filename: parsed.base,
            path: `/assets/images/${parsed.base}`,
          }
        : subscription.company_info.logo,
      energie_cost: +updateSubscriptionInfoDto.energie_cost,
      currency: updateSubscriptionInfoDto.currency,
    };

    subscription.company_info = company_info;

    await subscription.save();

    return subscription.populate(['admin', 'users']);
  }

  async addUser(id: string, user: string, session?: mongoose.ClientSession) {
    return this.SubscriptionModel.findByIdAndUpdate(
      id,
      { $push: { users: user } },
      { new: true, session },
    );
  }

  async deleteDevice(
    id: string,
    device: string,
    session?: mongoose.ClientSession,
  ) {
    return this.SubscriptionModel.findByIdAndUpdate(
      id,
      { $pull: { devices: device } },
      { new: true, session },
    );
  }

  async remove(id: string, _: ReqOptions) {
    const subscription = await this._findById(id).populate([
      'admin',
      'users',
      'devices',
    ]);

    if (!subscription) {
      throw new NotFoundException('Subscription Not Found');
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const admin = subscription.admin as UserDocument;

      const users = subscription.users as UserDocument[];

      const devices = subscription.devices as DeviceDocument[];

      const userPromises = users.map((u) => u.delete({ session }));
      const devicePromises = devices.map((d) => d.delete({ session }));

      // very dangerous??
      const promises = [
        admin.delete({ session }),
        ...userPromises,
        ...devicePromises,
        subscription.delete({ session }),
      ];

      console.log(promises);

      const res = await Promise.all(promises);

      console.log(res);

      await session.commitTransaction();
      await session.endSession();
      return subscription;
    } catch (error) {
      this.logger.error(error);
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  }
}
