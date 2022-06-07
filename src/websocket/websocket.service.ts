import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
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

    const user = await this.usersService.findById(decoded.sub);

    if (!user) {
      this.logger.error(`User with id ${decoded.sub} not found`);
      throw new Error('User not found');
    }

    if (user.role.includes('admin')) {
      socket.join('admin');
    }

    if (user.role.includes('user') && user.subscription) {
      socket.join(user.subscription as string);
    }

    socket.emit('authenticated', user);
  }
}
