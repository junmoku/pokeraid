import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { RedisService } from 'src/reedis/redis.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class HttpSessionGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const sessionId = request.headers['authorization'] || request.query.sessionId;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new UnauthorizedException('Missing session ID');
    }

    const session = await this.redisService.getSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const user = await this.userService.findById(session.id);
    request['user'] = user;
    return true;
  }
}
