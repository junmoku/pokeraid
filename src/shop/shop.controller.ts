import { Controller, Get } from '@nestjs/common';
import { ShopService } from './shop.service';

@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('/items')
  async getShopItems() {
    return this.shopService.getAvailablePokemonItems();
  }
}