import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { UserModule } from './user/user.module';
import { RedisModule } from './reedis/redis.module';
import { ShopModule } from './shop/shop.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { RoomModule } from './room/room.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'user',
      password: 'secret123',
      database: 'pokeraid',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
    }),
    RedisModule.forRootAsync(),
    UserModule,
    ShopModule,
    BlockchainModule,
    RoomModule,
  ],
})
export class AppModule {}
