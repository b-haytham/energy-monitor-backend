import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';
import { UsersService } from 'src/users/users.service';
import { AuthenticateDto } from './dto/authenticate.dto';

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async authenticate(socket: Socket, authenticateDto: AuthenticateDto) {
    const decoded = await this.jwtService.verify(authenticateDto.access_token);

    const user = await this.usersService.findById(decoded.sub, {});

    if (!user) {
      this.logger.error(
        `[Authentocicate]: User with id ${decoded.sub} not found`,
      );
      throw new Error('User not found');
    }

    if (user.role.includes('admin')) {
      socket.join('admin');
      socket.join(user._id.toString());
    }

    if (user.role.includes('user') && user.subscription) {
      this.logger.log(
        `Joining User to subscription channel >> ${
          (user.subscription as SubscriptionDocument)._id
        }`,
      );
      socket.join((user.subscription as SubscriptionDocument)._id.toString());
      socket.join(user._id.toString());
    }

    socket.emit('authenticated', user);
  }

  async logout(socket: Socket, authenticateDto: AuthenticateDto) {
    const decoded = await this.jwtService.verify(authenticateDto.access_token);

    const user = await this.usersService.findById(decoded.sub, {});
    // this.logger.debug(`logout user ${user ? user._id : user}`);

    if (!user) {
      this.logger.error(`[Logout]: User with id ${decoded.sub} not found`);
      throw new Error('User not found');
    }

    if (user.role.includes('admin')) {
      await socket.leave('admin');
      await socket.leave(user._id.toString());
    }

    if (user.role.includes('user') && user.subscription) {
      this.logger.log(
        `Leave User from subscription channel >> ${
          (user.subscription as SubscriptionDocument)._id
        }`,
      );
      socket.join((user.subscription as SubscriptionDocument)._id.toString());
      socket.join(user._id.toString());
    }
  }
}
