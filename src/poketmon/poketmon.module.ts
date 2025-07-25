import { TypeOrmModule } from "@nestjs/typeorm";
import { PoketmonService } from "./poketmon.service";
import { Poketmon, UserPoketmon } from "./poketmon.entity";
import { Module } from "@nestjs/common";
import { PoketmonSkill } from "./poketmon.skill.entity";

@Module({
  providers: [PoketmonService],
  exports: [PoketmonService],
  imports: [TypeOrmModule.forFeature([Poketmon, PoketmonSkill, UserPoketmon])],
})
export class PoketmonModule {}