import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { HttpSessionGuard } from 'src/guard/http.session.guard';
import { CreateUserDto, LoginResponseDto, LoginUserDto } from './user.dto';
import { User } from './user.entity';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.userService.register(dto.username, dto.password);
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto): Promise<LoginResponseDto> {
    return await this.userService.login(dto.username, dto.password);
  }

  @Get('poketmons')
  @UseGuards(HttpSessionGuard)
  async getMyPokemon(@Req() req: { user: User }) {
    return this.userService.getMyPokemons(req.user.id);
  }

  @Post('wallet/link')
  @UseGuards(HttpSessionGuard)
  async linkWallet(@Req() req: { user: User }, @Body('privateKey') privateKey: string) {
    return this.userService.linkWallet(req.user.id, privateKey);
  }
}
