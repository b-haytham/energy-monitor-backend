import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UsersService } from './users/users.service';

import * as bcrypt from 'bcrypt';
import { UserRole } from './users/entities/user.entity';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);

  constructor(private usersService: UsersService) {}

  async onModuleInit() {
    if (process.env.SUPER_USER_EMAIL && process.env.SUPER_USER_PASSWORD) {
      const users = await this.usersService.findAll({});
      if (!users || users.length === 0) {
        const user = await this.usersService.create({
          first_name: 'Admin',
          last_name: 'Admin',
          phone: '+380937777777',
          email: process.env.SUPER_USER_EMAIL,
          password: process.env.SUPER_USER_PASSWORD,
          role: UserRole.SUPER_ADMIN,
        });

        this.logger.debug('Created admin user', user.email);
      }
    }
  }
}
