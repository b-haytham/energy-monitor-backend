import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectConnection } from '@nestjs/mongoose';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserDocument, UserRole } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { ReqOptions } from 'src/utils/FindOptions';
import { LoginUserDto } from './dto/login-user.dto';

import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';
import { DevicesService } from 'src/devices/devices.service';
import { MailService } from 'src/mail/mail.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private subscriptionsService: SubscriptionsService,
    private devicesService: DevicesService,
    @InjectConnection() private connection: mongoose.Connection,
    private mailService: MailService,
    @InjectQueue('mail') private mailQueue: Queue,
  ) {}

  async register(createUserDto: CreateUserDto, options: ReqOptions) {
    const session = await this.connection.startSession();
    session.startTransaction();

    const logged_in_user = options.req.user;

    try {
      let user: UserDocument;

      // if the user to be create is `admin` role
      if (createUserDto.role == UserRole.ADMIN) {
        if (logged_in_user.role !== UserRole.SUPER_ADMIN) {
          this.logger.error(
            `Forbidden: role ${logged_in_user.role} <create> ${createUserDto.role}`,
          );
          throw new ForbiddenException();
        }
        user = await this.usersService.create(createUserDto, session);
      }

      // if the user to be create is `super_user` role
      if (createUserDto.role == UserRole.SUPER_USER) {
        if (!logged_in_user.role.includes('admin')) {
          this.logger.error(
            `Forbidden: role ${logged_in_user.role} <create> ${createUserDto.role}`,
          );
          throw new ForbiddenException();
        }
        user = await this.usersService.create(createUserDto, session);
      }

      // if the user to be create is `user` role
      if (createUserDto.role == UserRole.USER) {
        // if no subscription field in request body
        if (!createUserDto.subscription) {
          this.logger.error(`Subscription is required for user role`);
          throw new BadRequestException(
            'Subscription is required for user role',
          );
        }

        // if the to create is super_user
        if (
          logged_in_user.role == UserRole.SUPER_USER &&
          createUserDto.subscription !==
            (logged_in_user.subscription as SubscriptionDocument)._id.toString()
        ) {
          this.logger.error(`logged in user subscription don't match`);
          throw new ForbiddenException();
        }

        user = await this.usersService.create(createUserDto, session);
        const subscription = await this.subscriptionsService.addUser(
          user.subscription as string,
          user._id,
          session,
        );
        //id subscription returned is null >> not found subscription
        if (!subscription) {
          throw new BadRequestException('Subscription Not Found');
        }
      }

      await session.commitTransaction();
      await session.endSession();
      // create user
      return user.populate('subscription');
    } catch (error) {
      this.logger.error(`Register User error: ${error.message}`);
      await session.abortTransaction();
      await session.endSession();
      throw error;
    }
  }

  async login(loginUserDto: LoginUserDto) {
    // validate user email and password
    const user = await this.usersService.findByEmailAndPassword(
      loginUserDto.email,
      loginUserDto.password,
    );

    if (!user) {
      throw new BadRequestException('Wrong email or password');
    }

    await user.populate('subscription');

    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });
    return { access_token: token, user };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      this.logger.error('User Not Found');
      return {};
    }
    const token = this.jwtService.sign({ sub: user._id, email: user.email });
    await this.mailQueue.add('forgot-password', {
      token,
      user_id: user._id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
    });
    return {};
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    let decoded: { sub: string; email: string };
    try {
      decoded = this.jwtService.verify(resetPasswordDto.token);
    } catch (error) {
      this.logger.error(error);
      return {};
    }

    const user = await this.usersService.findByEmail(decoded.email);
    if (!user) {
      this.logger.error('[Reset Password]: User Not Found');
      return {};
    }

    const hash = await bcrypt.hash(resetPasswordDto.password, 10);
    user.password = hash;

    await user.save();

    return {};
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    options?: ReqOptions,
  ) {
    if (!options && !options.req.user) {
      throw new UnauthorizedException();
    }

    const user = options.req.user;

    const passwordMatch = await bcrypt.compare(
      changePasswordDto.current,
      user.password,
    );
    if (!passwordMatch) {
      this.logger.error("[Change Passworrd]: password don't match");
      throw new BadRequestException('Wrong credentials!');
    }

    const hash = await bcrypt.hash(changePasswordDto.new, 10);
    user.password = hash;

    await user.save();

    return user;
  }

  async createDeviceToken(data: { device: string }) {
    const device = await this.devicesService._findById(data.device);
    if (!device) {
      throw new NotFoundException('Device Not Found');
    }

    const token = this.jwtService.sign({
      sub: device._id,
      subscription: device.subscription,
    });
    await device.populate('subscription');
    return { access_token: token, device };
  }

  async verifyDeviceToken(data: { access_token: string }) {
    try {
      const payload = this.jwtService.decode(data.access_token) as {
        sub: string;
        subscription: string;
      };
      const device = await this.devicesService._findById(payload.sub);
      if (!device) {
        throw new BadRequestException('Device Not Found');
      }
      return device.populate('subscription');
    } catch (error) {
      this.logger.error('Verify Device Token Error: ${error.message}');
      throw error;
    }
  }
}
