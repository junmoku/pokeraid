// user.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RedisService } from 'src/reedis/redis.service';
import { CreateUserDto, LoginUserDto } from './user.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let userService: Partial<Record<keyof UserService, jest.Mock>>;
  let redisService: Partial<Record<keyof RedisService, jest.Mock>>;

  beforeEach(async () => {
    userService = {
      register: jest.fn(),
      validateUser: jest.fn(),
    };

    redisService = {
      getSessionIdByUserId: jest.fn(),
      deleteSession: jest.fn(),
      setSession: jest.fn(),
      setUserSessionMap: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const dto: CreateUserDto = { username: 'testuser', password: 'password' };
      const result = { id: 1, username: 'testuser' };
      userService.register?.mockResolvedValue(result);

      const response = await controller.register(dto);
      expect(response).toEqual(result);
      expect(userService.register).toHaveBeenCalledWith(dto.username, dto.password);
    });
  });

  describe('login', () => {
    it('should login an existing user', async () => {
      const dto: LoginUserDto = { username: 'testuser', password: 'password' };
      const user = { id: 1, username: 'testuser' };
      userService.validateUser?.mockResolvedValue(user);
      redisService.getSessionIdByUserId?.mockResolvedValue(null);
      redisService.setSession?.mockResolvedValue(undefined);
      redisService.setUserSessionMap?.mockResolvedValue(undefined);

      const response = await controller.login(dto);
      expect(response).toHaveProperty('sessionId');
      expect(response).toHaveProperty('username', user.username);
      expect(userService.validateUser).toHaveBeenCalledWith(dto.username, dto.password);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const dto: LoginUserDto = { username: 'testuser', password: 'wrongpassword' };
      userService.validateUser?.mockResolvedValue(null);

      await expect(controller.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(userService.validateUser).toHaveBeenCalledWith(dto.username, dto.password);
    });
  });
});
