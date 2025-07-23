import { Injectable, UnauthorizedException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { RedisService } from 'src/reedis/redis.service';
import { PoketmonService } from 'src/poketmon/poketmon.service';
import { encrypt } from 'src/utils/util.crypto';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly pokemonService: PoketmonService,
    private redisService: RedisService,
  ) {}

  async register(id: string, password: string) {
    const hashed = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ id, password: hashed });
    const savedUser = await this.userRepo.save(user);
    await this.pokemonService.giveStarterPokemon(savedUser.seq);
    return;
  }

  async login(
    id: string,
    password: string,
  ) {
    const user = await this.validateUser(id, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const existingSessionId = await this.redisService.getSessionIdByUserId(
      user.seq,
    );
    if (existingSessionId) {
      await this.redisService.deleteSession(existingSessionId);
    }

    const sessionId = uuidv4();
    await this.redisService.setSession(sessionId, {
      seq: user.seq,
      id: user.id,
    });
    await this.redisService.setUserSessionMap(user.seq, sessionId);

    return {
      sessionId,
      id: user.id,
    };
  }

  async validateUser(id: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getMyPokemons(seq: number) {
    return this.pokemonService.getUserPokemons(seq);
  }

  async linkWallet(seq: number, privateKey: string) {
    const wallet = new ethers.Wallet(privateKey);
    const encryptedPrivateKey = encrypt(privateKey);

    await this.userRepo.update(seq, {
      address: wallet.address,
      private_key: encryptedPrivateKey,
    });

    return;
  }

  async findByIdOrFail(seq: number): Promise<User> {
    return this.userRepo.findOneOrFail({ where: { seq: seq } });
  }
}
