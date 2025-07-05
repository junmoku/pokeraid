import { Injectable, UnauthorizedException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { RedisService } from 'src/reedis/redis.service';
import { PokemonService } from 'src/poketmon/poketmon.service';
import { encrypt } from 'src/utils/util.crypto';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

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
    return {};
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ sessionId: string; id: number }> {
    const user = await this.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const existingSessionId = await this.redisService.getSessionIdByUserId(
      user.id,
    );
    if (existingSessionId) {
      await this.redisService.deleteSession(existingSessionId);
    }

    const sessionId = uuidv4();
    await this.redisService.setSession(sessionId, {
      id: user.id,
      username: user.username,
    });
    await this.redisService.setUserSessionMap(user.id, sessionId);

    return {
      sessionId,
      id: user.id,
    };
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

  async linkWallet(userId: number, privateKey: string) {
    const wallet = new ethers.Wallet(privateKey);
    const encryptedPrivateKey = encrypt(privateKey);

    await this.userRepo.update(userId, {
      address: wallet.address,
      privateKey: encryptedPrivateKey,
    });

    return;
  }

  async findById(userId: number): Promise<User> {
    return this.userRepo.findOneOrFail({ where: { id: userId } });
  }
}
