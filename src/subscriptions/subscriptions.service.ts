import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  Subscription,
  SubscriptionDocument,
} from './entities/subscription.entity';

import * as mongoose from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';
import { FindOptions } from 'src/utils/FindOptions';

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

      // create subscription
      const subscription = new this.SubscriptionModel({
        ...createSubscriptionDto,
        admin: admin._id,
      });

      await subscription.save({ session });

      admin.subscription = subscription._id;
      await admin.save({ session });

      await session.commitTransaction();
      await session.endSession();
      return subscription;
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

    return subscriptions.sort({ createdAt: -1 });
  }

  findById(id: string, query: QuerySubscriptionsDto, options?: FindOptions) {
    const subscription = this.SubscriptionModel.findById(id);

    if (query && query.p) {
      const populate = query.p.split(',');
      subscription.populate(populate);
    }

    return subscription;
  }

  findByAdmin(admin: string | mongoose.ObjectId) {
    return this.SubscriptionModel.findOne({ admin });
  }

  findByUser(user: string | mongoose.ObjectId) {
    return this.SubscriptionModel.find({ users: { $in: [user] } });
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
    return subscription;
  }

  remove(id: string) {
    return `This action removes a #${id} subscription`;
  }
}
