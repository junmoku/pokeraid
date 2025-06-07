// room.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/reedis/redis.service';
import { User } from 'src/user/user.entity';
import { UserService } from 'src/user/user.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomService {
  constructor(
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {}

  async createRoom(user: User) {
    const roomId = uuidv4();
    await this.redisService.createRoom(roomId, user.id);
    return this.getRoom(roomId);
  }

  async getRoom(roomId: string) {
    const ids = await this.redisService.getRoom(roomId);
    const members = await Promise.all(
      ids.map(async (id) => {
        const user = await this.userService.findById(parseInt(id));
        return { id: user.id, username: user.username };
      }),
    );
    return { roomId, members };
  }

  async getRooms() {
    const rooms = await this.redisService.getRooms();
    const roomIds = rooms.map((key) => key.split(':')[1]);
    return Promise.all(roomIds.map((roomId) => this.getRoom(roomId)));
  }

  async joinRoom(roomId: string, user: User) {
    await this.redisService.joinRoom(roomId, user.id);
    return this.getRoom(roomId);
  }

  async leaveRoom(roomId: string, user: User) {
    await this.redisService.leaveRoom(roomId, user.id);
    return this.getRoom(roomId);
  }
}
