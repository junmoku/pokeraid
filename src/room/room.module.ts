import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { RedisModule } from 'src/reedis/redis.module';
import { UserModule } from 'src/user/user.module';
import { RoomService } from './room.servie';
import { RoomController } from './room.controller';
import { PoketmonModule } from 'src/poketmon/poketmon.module';
import { BlockchainModule } from 'src/blockchain/blockchain.module';

@Module({
  imports: [RedisModule, UserModule, PoketmonModule, BlockchainModule],
  providers: [RoomService, RoomGateway],
  controllers: [RoomController],
})
export class RoomModule {}
