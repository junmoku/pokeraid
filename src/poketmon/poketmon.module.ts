import { TypeOrmModule } from "@nestjs/typeorm";
import { PokemonService } from "./poketmon.service";
import { Poketmon, UserPoketmon } from "./poketmon.entity";
import { Module } from "@nestjs/common";
import { PoketmonSkill } from "./poketmon.skill.entity";

@Module({
  providers: [PokemonService],
  exports: [PokemonService],
  imports: [TypeOrmModule.forFeature([Poketmon, PoketmonSkill, UserPoketmon])],
})
export class PoketmonModule {}