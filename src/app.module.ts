import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GlobalJwtModule } from './jwt/jwt.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DevicesModule } from './devices/devices.module';
import { MqttModule } from './mqtt/mqtt.module';
import { StorageModule } from './storage/storage.module';
import { DataModule } from './data/data.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    GlobalJwtModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGO_URI'),
        replicaSet: 'rs0',
        readPreference: 'primary',
        directConnection: true,
      }),
    }),
    UsersModule,
    AuthModule,
    SubscriptionsModule,
    DevicesModule,
    MqttModule,
    StorageModule,
    DataModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
