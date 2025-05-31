import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { UserModule } from './user/user.module';
import { RedisModule } from './reedis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'user',
      password: 'secret123',
      database: 'pokeraid',
      entities: [User],
      synchronize: true,
    }),
    RedisModule.forRootAsync(),
    UserModule,
  ],
})
export class AppModule {}
