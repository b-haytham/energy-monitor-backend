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
import { MailModule } from './mail/mail.module';
import { BullModule } from '@nestjs/bull';
import { JobsModule } from './jobs/jobs.module';
import { ReportsModule } from './reports/reports.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AlertsModule } from './alerts/alerts.module';
import { MulterModule } from '@nestjs/platform-express';
import { NestjsFormDataModule } from 'nestjs-form-data';

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
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
        },
      }),
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    SubscriptionsModule,
    DevicesModule,
    MqttModule,
    StorageModule,
    DataModule,
    WebsocketModule,
    MailModule,
    JobsModule,
    ReportsModule,
    AlertsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
