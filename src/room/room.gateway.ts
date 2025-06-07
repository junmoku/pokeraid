// src/room/room.gateway.ts
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsSessionGuard } from 'src/guard/ws.session.guard';
import { RoomService } from './room.servie';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets/interfaces/hooks';
import { RedisService } from 'src/reedis/redis.service';
import { JoinRoomDto, LeaveRoomDto } from './room.dto';

@WebSocketGateway({ namespace: '/rooms', cors: true })
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

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
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: JoinRoomDto,
  ) {
    const user = client['user'];
    const room = await this.roomService.joinRoom(body.roomId, user);
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

    console.log('aaaaa : ' + body.roomId)

    const user = client['user'];

        console.log('aaaaa : ' + user.id)


    const room = await this.roomService.leaveRoom(body.roomId, user);
    client.leave(body.roomId);
    this.server.to(body.roomId).emit('roomUpdate', room);

    return { success: true };
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('test')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; message: string },
  ) {
    const user = client['user'];
    this.server.to(payload.roomId).emit('test', {
      from: user.username,
      message: payload.message,
    });
  }
}
