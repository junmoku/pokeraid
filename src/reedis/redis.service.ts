// src/redis/redis.service.ts
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly client: Redis) {}

  async setSession(sessionId: string, data: any, ttlSeconds = 3600) {
    await this.client.set(
      `session:${sessionId}`,
      JSON.stringify(data),
      'EX',
      ttlSeconds,
    );
  }

  async getSession(sessionId: string) {
    const raw = await this.client.get(`session:${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  }

  async deleteSession(sessionId: string) {
    await this.client.del(`session:${sessionId}`);
  }

  async getSessionIdByUserId(userId: number): Promise<string | null> {
    return await this.client.get(`user:${userId}`);
  }

  async setUserSessionMap(userId: number, sessionId: string, ttl = 3600) {
    await this.client.set(`user:${userId}`, sessionId, 'EX', ttl);
  }

  async createRoom(roomId: string, userId: number) {
    await this.client.sadd(`room:${roomId}:members`, userId);
  }

  async joinRoom(roomId: string, userId: number) {
    await this.client.sadd(`room:${roomId}:members`, userId);
  }

  async leaveRoom(roomId: string, userId: number) {
    await this.client.srem(`room:${roomId}:members`, userId);
  }

  async getRoom(roomId: string) {
    return await this.client.smembers(`room:${roomId}:members`);
  }

  async getRooms() {
    return await this.client.keys('room:*:members');
  }
}
