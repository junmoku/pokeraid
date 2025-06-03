import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from './shop.entity';
import { Poketmon } from 'src/poketmon/poketmon.entity';
import { PokemonService } from 'src/poketmon/poketmon.service';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Shop)
    private readonly shopRepo: Repository<Shop>,
    private readonly pokemonService: PokemonService,
  ) {}

  async getAvailablePokemonItems() {
    const shopItems = await this.shopRepo.find({ where: { type: 'POKEMON' } });

    const results = await Promise.all(
      shopItems.map(async (item) => {
        const pokemon = await this.pokemonService.getPokemonWithSkills(item.target_id);
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
}