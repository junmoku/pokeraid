import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from './shop.entity';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { Poketmon } from 'src/poketmon/poketmon.entity';
import { PokemonService } from 'src/poketmon/poketmon.service';
import { PoketmonModule } from 'src/poketmon/poketmon.module';

@Module({
  imports: [TypeOrmModule.forFeature([Shop, Poketmon]), PoketmonModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}