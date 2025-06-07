import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { Poketmon } from 'src/poketmon/poketmon.entity';
import { PoketmonModule } from 'src/poketmon/poketmon.module';
import { ShopController } from './shop.controller';
import { Shop } from './shop.entity';
import { ShopService } from './shop.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shop, Poketmon]), PoketmonModule, BlockchainModule, UserModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}