import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserRole } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    this.logger.log(`Required Roles { ${roles.join(', ')} }`);

    const request: Request = context.switchToHttp().getRequest();
    this.logger.debug(`URL >> ${request.url}`);

    const token =
      (request.headers.authorization &&
        request.headers.authorization.split(' ')[1]) ||
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      request.session['access_token'];

    if (!token) {
      this.logger.error('No token');
      return false;
    }

    let decoded: JwtPayload;
    try {
      decoded = this.jwtService.decode(token) as JwtPayload;
    } catch (e) {
      this.logger.error('Invalid token');
      return false;
    }

    const user = await this.usersService.findById(decoded.sub, {});
    if (!user) {
      this.logger.error('User not found');
      return false;
    }

    const allowedRole = roles.find((role) => role === user.role);
    if (!allowedRole) {
      this.logger.error('User role not allowed');
      return false;
    }

    request.user = user;

    if (user.role.includes('user') && !request.user.subscription) {
      this.logger.error('User subscription not found');
      return false;
    }

    return true;
  }
}
