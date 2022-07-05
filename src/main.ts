import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

import * as cookieSession from 'cookie-session';
import { MqttOptions, Transport } from '@nestjs/microservices';
import { HttpExceptionFilter } from './global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());

  app.set('trust proxy', true);

  app.enableCors({
    credentials: true,
    origin: process.env.CORS_ALLOW_ORIGINS.split(','),
  });

  app.use(
    cookieSession({
      name: 'sess',
      keys: ['key'],
      domains: process.env.COOKIE_DOMAINS
        ? process.env.COOKIE_DOMAINS.split(',')
        : undefined,
    }),
  );

  app.connectMicroservice<MqttOptions>({
    transport: Transport.MQTT,
    options: {
      url: process.env.MQTT_URL,
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
