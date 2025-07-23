// src/room/room.gateway.ts
import {
  ConflictException,
  ForbiddenException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets/interfaces/hooks';
import { Server, Socket } from 'socket.io';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { WsSessionGuard } from 'src/guard/ws.session.guard';
import { PoketmonService } from 'src/poketmon/poketmon.service';
import { RedisService } from 'src/reedis/redis.service';
import { UserService } from 'src/user/user.service';
import { createRoomDto, JoinRoomDto, LeaveRoomDto } from './room.dto';
import { RoomService } from './room.servie';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({ namespace: '/rooms', cors: true })
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly maxMemberCount = 4;

  constructor(
    private readonly roomService: RoomService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly poketmonService: PoketmonService,
    private readonly blockchainService: BlockchainService,
  ) {}

  handleConnection(client: Socket) {
    const sessionId = client.handshake.headers['sessionid'];
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
    @MessageBody() body: createRoomDto,
  ) {
    const user = client['user'];
    const userRoom = await this.redisService.getUserRoom(user.seq);
    if (userRoom) {
      throw new ConflictException('already member');
    }
    const boss = await this.poketmonService.getPokemonWithSkills(body.boosId);
    if (!boss) {
      throw new Error();
    }
    const myPoketmons = await this.poketmonService.getUserPokemons(user.seq);
    if (!myPoketmons.some(p => p.poketmonId == body.myPoketmonId)) {
      throw new Error();
    }
    // const roomId = uuidv4();
    const roomId = '2b9e9d3d-ff84-429a-901c-faeeeedd7888';
    await this.redisService.createRoom(roomId, user.seq, boss.id);
    await this.redisService.joinRoom(roomId, user.seq, body.myPoketmonId);
    const updateRoom = await this.roomService.getRoom(roomId);

    client.join(updateRoom.roomId);
    this.server.to(updateRoom.roomId).emit('roomUpdate', updateRoom);
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

    const room = await this.roomService.getRoom(body.roomId);
    if (!room) {
      throw new ForbiddenException('room not found');
    }
    if (memberCount >= this.maxMemberCount) {
      throw new ForbiddenException('max member count');
    }
    const userRoom = await this.redisService.getUserRoom(user.id);
    if (userRoom) {
      throw new ConflictException('already member');
    }
    await this.redisService.joinRoom(body.roomId, user.seq, body.myPoketmonId);
    client.join(body.roomId);
    const roomUpdate = await this.roomService.getRoom(body.roomId);
    this.server.to(body.roomId).emit('roomUpdate', roomUpdate);
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
      String(user.seq),
    );

    console.log(isMember);

    if (!isMember) {
      throw new Error('not member');
    }
    await this.redisService.leaveRoom(body.roomId, user.seq);
    const room = await this.roomService.getRoom(body.roomId);
    const memberCount = await this.redisService.getMemberCount(body.roomId);
    if (memberCount <= 0) {
      await this.redisService.removeRoom(body.roomId);
    }
    client.leave(body.roomId);
    const roomUpdate = await this.roomService.getRoom(body.roomId);
    this.server.to(body.roomId).emit('roomUpdate', roomUpdate);
    return room;
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('startRaid')
  async handleStartRaid(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const user = client['user'];
    const room = await this.roomService.getRoom(body.roomId);

    if (room.leaderId !== user.seq) {
      throw new ForbiddenException('Only the room leader can start the raid');
    }

    const boss = await this.poketmonService.getPokemonWithSkills(
      room.bossPokemonId,
    );
    if (!boss) throw new Error('Boss not found');

    const members = await Promise.all(
      room.members.map(async (member) => {
        const pokemons = await this.poketmonService.getUserPokemons(member.usreSeq);
        const selected = pokemons.find((p) => p.poketmonId === member.pokemonId);
        if (!selected) throw new Error(`Invalid pokemon for user ${member.userSeq}`);

        return {
          order: member.order,
          userSeq: member.userSeq,
          connectionStatus: 'on',
          poketmon: {
            seq: selected.poketmonId,
            hp: selected.hp,
            skills: selected.skills.map((s) => ({
              seq: s.skill_id,
              pp: s.pp,
            })),
          },
        };
      }),
    );

    const bossMember = {
      order: 0,
      userSeq: 0,
      connectionStatus: 'on',
      poketmon: {
        hp: boss.hp,
        skills: boss.skills.map((s) => ({
          seq: s.skill_id,
          count: s.pp,
        })),
      },
    };

    const sortedMembers = [...members].sort((a, b) => a.order - b.order);
    const battleState = {
      members: [...sortedMembers, bossMember],
      turn: { count: 1, next: sortedMembers[0].userSeq },
      action: null,
      status: 'fighting',
    };

    await this.redisService.setBattleState(body.roomId, battleState);
    this.server.to(body.roomId).emit('changeTurn', battleState);
  }

  @UseGuards(WsSessionGuard)
  @SubscribeMessage('action')
  async handleAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string; skillSeq: number },
  ) {
    const user = client['user'];
    const state = await this.redisService.getBattleState(body.roomId);

    console.log(user);
    console.log("state");
    console.log(state);

    if (state.turn.next !== user.seq) {
      throw new ForbiddenException('Not your turn');
    }

    const actor = state.members.find((m) => m.userSeq === user.seq);
    const boss = state.members.find((m) => m.userSeq === 0);
    const skill = actor.poketmon.skills.find((s) => s.seq === body.skillSeq);
    if (!skill || skill.pp <= 0) {
      throw new Error('Invalid or exhausted skill');
    }

    skill.pp -= 1;

    const actorPoketmon = await this.poketmonService.getPokemonWithSkills(actor.poketmon.seq);
    const actionSkill = actorPoketmon?.skills.find(s => s.skill_id == body.skillSeq);
    if (!actionSkill) {
      throw new Error();
    }
    
    console.log("boss");
    console.log(boss);

    boss.poketmon.hp = Math.max(0, boss.poketmon.hp - actionSkill.damage);

    const status = this.checkBattleStatus(state);
    const nextUser = this.getNextAliveUser(state, user.seq);

    const updatedState = {
      ...state,
      action: {
        actor: user.seq,
        skill: skill.seq,
        target: [0],
      },
      turn: {
        count: state.turn.count + 1,
        next: nextUser,
      },
      status,
    };

    await this.redisService.setBattleState(body.roomId, updatedState);
    this.server.to(body.roomId).emit('changeTurn', updatedState);

    if ((nextUser === 0) && (status === 'fighting')) {
      this.executeBossTurn(body.roomId);
    }

    if (status !== 'fighting') {
      const players = state.members.filter((m) => m.id !== 0);
      this.distributeRewards(players, status);
      this.finalizeBattle(body.roomId, players);
    }
  }

  private async executeBossTurn(roomId: string) {
    const state = await this.redisService.getBattleState(roomId);
    const boss = state.members.find((m) => m.userSeq === 0);
    const alivePlayers = state.members.filter((m) => m.userSeq !== 0 && m.poketmon.hp > 0);

    const skills = boss.poketmon.skills;
    const selectedSkill = skills[Math.floor(Math.random() * skills.length)];

    const bossPokemonId = await this.redisService.getRoomBoss(roomId);
    const actorPoketmon = await this.poketmonService.getPokemonWithSkills(bossPokemonId);
    const actionSkill = actorPoketmon?.skills.find(s => s.skill_id == selectedSkill);
    if (!actionSkill) {
      throw new Error();
    }

    // skill.pp -= 1;

    let targets: typeof alivePlayers = [];    
    if (actionSkill.target === 'SINGLE') {
      const randomIndex = Math.floor(Math.random() * Number(alivePlayers.length));
      targets = [alivePlayers[randomIndex]];
    } else if (actionSkill.target === 'ALL') {
      targets = alivePlayers;
    }

    for (const target of targets) {
      target.poketmon.hp = Math.max(0, target.poketmon.hp - actionSkill.damage);
    }

    const status = this.checkBattleStatus(state);
    const nextUser = this.getNextAliveUser(state, 0);

    const updatedState = {
      ...state,
      action: {
        actor: 0,
        skill: selectedSkill.seq,
        target: targets.map((t) => t.userSeq),
      },
      turn: {
        count: state.turn.count + 1,
        next: nextUser,
      },
      status,
    };

    await this.redisService.setBattleState(roomId, updatedState);
    this.server.to(roomId).emit('changeTurn', updatedState);

    if (status !== 'fighting') {
      const players = state.members.filter((m) => m.userSeq !== 0);
      this.distributeRewards(players, status);
      this.finalizeBattle(roomId, players);
    }
  }


  private checkBattleStatus(state): 'fighting' | 'win' | 'defeat' {
    const boss = state.members.find((m) => m.userSeq === 0);
    const alivePlayers = state.members.filter((m) => m.userSeq !== 0 && m.poketmon.hp > 0);
    if (boss.poketmon.hp <= 0) return 'win';
    if (alivePlayers.length === 0) return 'defeat';
    return 'fighting';
  }

  private getNextAliveUser(state, currentId): number {
    const ordered = state.members
      .filter((m) => m.userSeq !== 0 && m.poketmon.hp > 0)
      .sort((a, b) => a.order - b.order);
    const currentIndex = ordered.findIndex((m) => m.userSeq === currentId);
    return currentIndex === ordered.length - 1 ? 0 : ordered[currentIndex + 1].userSeq;
  }

  private distributeRewards(members: { userSeq: number }[], status: 'win' | 'defeat') {
    const amount = status === 'win' ? '30' : '10';
    for (const member of members) {
      this.userService.findByIdOrFail(member.userSeq).then((user) => {
        this.blockchainService.grantTokens(user, amount).catch((err) => {
          console.error(`Failed to send tokens to user ${user.id}:`, err);
        });
      });
    }
  }

  private async finalizeBattle(roomId: string, members: { userSeq: number }[]) {
  await this.redisService.removeBattleState(roomId);
  await this.redisService.removeRoom(roomId);

  for (const member of members) {
    await this.redisService.removeUserRoomMapping(member.userSeq);
  }
}


}
