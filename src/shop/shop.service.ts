import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { PoketmonService } from 'src/poketmon/poketmon.service';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { Shop } from './shop.entity';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    private readonly poketmonService: PoketmonService,
    private readonly blockchainService: BlockchainService,
  ) {}

  async getAvailablePokemonItems() {
    const shopItems = await this.shopRepo.find({ where: { type: 'POKETMON' } });

    const results = await Promise.all(
      shopItems.map(async (item) => {
        const pokemon = await this.poketmonService.getPokemonWithSkills(
          item.target_id,
        );
        return {
          shop_id: item.id,
          price: item.price,
          stock: item.stock,
          pokemon,
        };
      }),
    );
    return results;
  }

  async purchaseItem(user: User, itemId: number) {
    const item = await this.shopRepo.findOne({ where: { id: itemId, type: 'POKETMON' } });
    if (!item) throw new BadRequestException('Item not found');
    if (item.stock <= 0) throw new BadRequestException('Item is out of stock');

    const txHash = await this.blockchainService.deductTokens(user, String(item.price));
    await this.poketmonService.givePokemon(user.seq, item.target_id);
    await this.shopRepo.decrement({ id: item.id }, 'stock', 1);

    return { itemId: item.id, txHash };
  }
}
