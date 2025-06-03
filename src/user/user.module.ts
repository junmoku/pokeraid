import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PoketmonModule } from 'src/poketmon/poketmon.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), PoketmonModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
