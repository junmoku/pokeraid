import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoomDto {

  @IsString()
  @IsNotEmpty()
  roomName: string;

  @IsString()
  @IsNotEmpty()
  roomLevel: string;

  @IsString()
  @IsNotEmpty()
  usePoketmonId: string;
}

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;
}

export class LeaveRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;
}

export class TestRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
