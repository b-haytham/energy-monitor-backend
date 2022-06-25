import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';

import * as bcrypt from 'bcrypt';

import * as mongoose from 'mongoose';
import { QueryUserDto } from './dto/query-user.dto';
import { FindOptions } from 'src/utils/FindOptions';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private UserModel: mongoose.Model<UserDocument>,
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

  async update(id: string, updateUserDto: UpdateUserDto) {
    return this.UserModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
    }).populate('subscription');
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
