// src/room/room.gateway.ts
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
    ConflictException,
  ForbiddenException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { WsSessionGuard } from 'src/guard/ws.session.guard';
import { RoomService } from './room.servie';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets/interfaces/hooks';
import { RedisService } from 'src/reedis/redis.service';
import { CreateRoomDto, JoinRoomDto, LeaveRoomDto, TestRoomDto } from './room.dto';

@WebSocketGateway({ namespace: '/rooms', cors: true })
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly maxMemberCount = 4;

  constructor(
    private readonly roomService: RoomService,
    private readonly redisService: RedisService,
  ) {}

  handleConnection(client: Socket) {
    const sessionId = client.handshake.query.sessionId;
    if (!sessionId || typeof sessionId !== 'string') {
      client.disconnect();
      return;
    }
    this.redisService.getSession(sessionId).then((session) => {
      if (!session) {
        client.disconnect();
      } else {
        console.log(`Client connected: ${client.id}`);
      }
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }


  @UseGuards(WsSessionGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: CreateRoomDto,
  ) {
    console.log(client['user']);
    const user = client['user'];
    console.log("createRoomcreateRoom");

    const userRoom = await this.redisService.getUserRoom(user.id);
    if (userRoom) {
      throw new ConflictException('already member');
    }
    const room = await this.roomService.createRoom(user);
    client.join(room.roomId);
    this.server.to(room.roomId).emit('roomUpdate', room);
  }

  @UseGuards(WsSessionGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinRoomDto,
  ) {
    const user = client['user'];
    const memberCount = await this.redisService.getMemberCount(body.roomId);
    if (memberCount >= this.maxMemberCount) {
      throw new ForbiddenException('max member count');
    }
    const userRoom = await this.redisService.getUserRoom(user.id);
    if (userRoom) {
      throw new ConflictException('already member');
    }
    await this.redisService.joinRoom(body.roomId, user.id);
    const room = await this.roomService.getRoom(body.roomId);
    client.join(body.roomId);
    this.server.to(body.roomId).emit('roomUpdate', room);
  }

  @UseGuards(WsSessionGuard)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: LeaveRoomDto,
  ) {
    const user = client['user'];
    const isMember = await this.redisService.isMember(
      body.roomId,
      String(user.id),
    );
    if (!isMember) {
      throw new ForbiddenException('not member');
    }
    await this.redisService.leaveRoom(body.roomId, user.id);
    const room = await this.roomService.getRoom(body.roomId);
    const memberCount = await this.redisService.getMemberCount(body.roomId);
    if (memberCount <= 0) {
      await this.redisService.removeRoom(body.roomId);
    }
    client.leave(body.roomId);
    this.server.to(body.roomId).emit('roomUpdate', room);
    return room;
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('test')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: TestRoomDto,
  ) {
    const user = client['user'];
    const isMember = await this.redisService.isMember(
      body.roomId,
      String(user.id),
    );
    if (!isMember) {
      throw new ForbiddenException('not member');
    }
    this.server.to(body.roomId).emit('test', {
      from: user.username,
      message: body.message,
    });
  }
}
