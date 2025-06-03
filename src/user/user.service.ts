import { Injectable, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { RedisService } from 'src/reedis/redis.service';
import { PokemonService } from 'src/poketmon/poketmon.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly pokemonService: PokemonService,
    private redisService: RedisService,
  ) {}

  async register(username: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ username, password: hashed });
    const savedUser = await this.userRepo.save(user);
    await this.pokemonService.giveStarterPokemon(savedUser.id);
    return;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getMyPokemons(userId: number) {
    return this.pokemonService.getUserPokemons(userId);
  }
}
