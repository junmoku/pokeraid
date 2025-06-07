// room.service.ts
import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
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
    const userRoom = await this.redisService.getUserRoom(user.id);
    if (userRoom) {
      throw new ConflictException('already member');
    }
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

  async leaveRoom(roomId: string, user: User) {
    const isMember = await this.redisService.isMember(roomId, String(user.id));
    if (!isMember) {
      throw new ForbiddenException('not member');
    }
    await this.redisService.leaveRoom(roomId, user.id);
    return this.getRoom(roomId);
  }
}
