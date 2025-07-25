import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { AuthenticatedRequest, HttpSessionGuard } from 'src/guard/http.session.guard';
import { CreateUserDto, LoginResponseDto, LoginUserDto } from './user.dto';
import { User } from './user.entity';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return await this.userService.register(dto.id, dto.password);
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto): Promise<LoginResponseDto> {
    return await this.userService.login(dto.id, dto.password);
  }

  @Get('poketmons')
  @UseGuards(HttpSessionGuard)
  async getMyPokemon(@Req() req: AuthenticatedRequest) {
    return this.userService.getMyPokemons(req.user.seq);
  }

  @Post('wallet/link')
  @UseGuards(HttpSessionGuard)
  async linkWallet(@Req() req: AuthenticatedRequest, @Body('privateKey') privateKey: string) {
    return this.userService.linkWallet(req.user.seq, privateKey);
  }
}
