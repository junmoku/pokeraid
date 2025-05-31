import {
  Controller,
  Post,
  Body,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, LoginResponseDto, LoginUserDto } from './user.dto';
import { RedisService } from 'src/reedis/redis.service';
import { Request } from 'express';
import { v4 as uuidv4, v4 } from 'uuid';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.userService.register(dto.username, dto.password);
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto): Promise<LoginResponseDto> {
    const user = await this.userService.validateUser(
      dto.username,
      dto.password,
    );
    if (!user) throw new UnauthorizedException('Invalid credentials');

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
      username: user.username,
    };
  }
}
