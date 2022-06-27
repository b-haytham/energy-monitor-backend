import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { SubscriptionsModule } from 'src/subscriptions/subscriptions.module';
import { DevicesModule } from 'src/devices/devices.module';

@Global()
@Module({
  imports: [UsersModule, SubscriptionsModule, DevicesModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, UsersModule],
})
export class AuthModule {}
