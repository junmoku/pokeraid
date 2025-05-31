import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import Redis from 'ioredis';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const redisClient: Redis = app.get('REDIS_CLIENT'); // DI에서 가져오기

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
