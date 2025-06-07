import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { UserModule } from 'src/user/user.module';
import { RedisModule } from 'src/reedis/redis.module';

@Module({
  imports: [RedisModule, UserModule],
  providers: [BlockchainService],
  controllers: [BlockchainController],
  exports: [BlockchainService],
})
export class BlockchainModule {}