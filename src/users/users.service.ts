import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateUserInfoDto } from './dto/update-user.dto';
import { User, UserDocument, UserRole } from './entities/user.entity';

import * as bcrypt from 'bcrypt';

import * as mongoose from 'mongoose';
import { QueryUserDto } from './dto/query-user.dto';
import { FindOptions, ReqOptions } from 'src/utils/FindOptions';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private UserModel: mongoose.Model<UserDocument>,
    @InjectConnection() private connection: mongoose.Connection,
  ) {}

  async create(createUserDto: CreateUserDto, session?: mongoose.ClientSession) {
    // check if exists
    const user = await this.UserModel.findOne({ email: createUserDto.email });
    if (user) {
      throw new BadRequestException('User already exists');
    }
    // hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    // create user
    const newUser = new this.UserModel({
      ...createUserDto,
      password: hashedPassword,
    });
    return newUser.save({ session });
  }

  findAll(query: QueryUserDto, options?: FindOptions) {
    const users = this.UserModel.find();

    if (query && query.p) {
      const populate = query.p.split(',');
      users.populate(populate);
    }

    if (
      options &&
      options.req &&
      options.req.user &&
      options.req.user.subscription &&
      options.req.user.role.includes('user')
    ) {
      users.where('subscription').equals(options.req.user.subscription);
    }

    return users.populate('subscription').sort({ createdAt: -1 });
  }

  async findByEmail(email: string) {
    return this.UserModel.findOne({ email });
  }

  async findByEmailAndPassword(email: string, password: string) {
    //check if user exists
    const user = await this.UserModel.findOne({ email });
    this.logger.debug(`User found: ${user}`);
    if (!user) {
      return null;
    }
    //check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    this.logger.debug(`Password correct: ${isPasswordCorrect}`);
    if (!isPasswordCorrect) {
      return null;
    }
    return user;
  }

  async findById(id: string, query: QueryUserDto, options?: FindOptions) {
    const user = this.UserModel.findById(id);

    if (
      options &&
      options.req &&
      options.req.user &&
      options.req.user.subscription &&
      options.req.user.role.includes('user')
    ) {
      user.where('subscription').equals(options.req.user.subscription);
    }

    return user.populate('subscription');
  }

  _findById(id: string) {
    return this.UserModel.findById(id);
  }

  async updateSubsciption(
    id: string,
    subscription: string,
    session?: mongoose.ClientSession,
  ) {
    return this.UserModel.findByIdAndUpdate(
      id,
      {
        $set: { subscription: new mongoose.Types.ObjectId(subscription) },
      },
      { new: true, session },
    );
  }

  async updateInfo(
    id: string,
    updateUserInfoDto: UpdateUserInfoDto,
    options: ReqOptions,
  ) {
    const loggedInUser = options.req.user;
    if (loggedInUser._id.toString() !== id) {
      throw new ForbiddenException();
    }

    const user = await this._findById(id);
    if (!user) {
      this.logger.log('[Update]: User not found');
      throw new NotFoundException('User not Found');
    }

    user.first_name = updateUserInfoDto.first_name;
    user.last_name = updateUserInfoDto.last_name;

    await user.save();

    return user.populate('subscription');
  }

  async update(id: string, updateUserDto: UpdateUserDto, options: ReqOptions) {
    const loggedInUser = options.req.user;

    const user = await this._findById(id);
    if (!user) {
      this.logger.log('[Update]: User not found');
      throw new NotFoundException('User not Found');
    }

    // if (
    //   loggedInUser.role == UserRole.ADMIN &&
    //   user.role.includes('admin') &&
    //   loggedInUser._id.toString() !== user._id.toString()
    // ) {
    //   throw new ForbiddenException();
    // }

    if (!this.canUpdateUser(loggedInUser, user)) {
      throw new ForbiddenException();
    }

    delete updateUserDto.password;

    user.set(updateUserDto);

    await user.save();

    return user.populate('subscription');
  }

  async remove(id: string, options: ReqOptions) {
    /*
       TODO FIX THIS --
    */
    const loggedInUser = options.req.user;
    const user = await this._findById(id).populate('subscription');

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    if (loggedInUser.role.includes('user') && user.role.includes('admin')) {
      throw new ForbiddenException();
    }

    if (
      loggedInUser.role == UserRole.ADMIN &&
      user.role == UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException();
    }

    if (
      loggedInUser.role.includes('user') &&
      !loggedInUser.subscription &&
      !user.subscription
    ) {
      throw new ForbiddenException();
    }

    if (user.role == UserRole.SUPER_USER && user.subscription) {
      throw new BadRequestException('Delete Subscription First');
    }

    if (
      loggedInUser.role.includes('user') &&
      (loggedInUser.subscription as SubscriptionDocument)._id.toString() !==
        (user.subscription as SubscriptionDocument)._id.toString()
    ) {
      this.logger.error("[Remove]: subscriptions don't match");
      throw new ForbiddenException();
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      if (user.role == UserRole.USER) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        (user.subscription as SubscriptionDocument).users.pull(user._id);
        await (user.subscription as SubscriptionDocument).save({ session });
        await user.delete({ session });
      }

      await user.delete({ session });

      await session.commitTransaction();
      await session.endSession();
      return user;
    } catch (error) {
      this.logger.error(error);
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  }

  private canUpdateUser(
    loggedInUser: UserDocument,
    user: UserDocument,
  ): boolean {
    const loggedInUserSubscriptionId = (
      loggedInUser.subscription as SubscriptionDocument
    )._id;
    const userToUpdateSubscriptionId = (
      user.subscription as SubscriptionDocument
    )._id;
    this.logger.debug(
      `loggedInUserSubscriptionId : ${loggedInUserSubscriptionId}`,
    );
    this.logger.debug(
      `userToUpdateSubscriptionId : ${userToUpdateSubscriptionId}`,
    );

    if (
      loggedInUser.role == UserRole.SUPER_USER &&
      loggedInUserSubscriptionId.toString() !==
        userToUpdateSubscriptionId.toString()
    ) {
      return false;
    }

    if (
      loggedInUser.role == UserRole.ADMIN &&
      user.role == UserRole.SUPER_ADMIN
    ) {
      return false;
    }

    return true;
  }
}
