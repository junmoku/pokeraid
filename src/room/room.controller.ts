// room.controller.ts
import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { RoomService } from './room.servie';
import { HttpSessionGuard } from 'src/guard/http.session.guard';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post('createRoom')
  @UseGuards(HttpSessionGuard)
  async createRoom(@Req() req: any) {
    return await this.roomService.createRoom(req.user);
  }

  @Get('getRooms')
  @UseGuards(HttpSessionGuard)
  async getRooms() {
    return await this.roomService.getRooms();
  }
}
