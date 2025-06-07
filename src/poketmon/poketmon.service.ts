import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Poketmon, UserPoketmon } from './poketmon.entity';
import { PoketmonSkill } from './poketmon.skill.entity';

@Injectable()
export class PokemonService {
  constructor(
    @InjectRepository(Poketmon)
    private pokemonRepo: Repository<Poketmon>,
    @InjectRepository(PoketmonSkill)
    private pokemonSkillRepo: Repository<PoketmonSkill>,
    @InjectRepository(UserPoketmon)
    private userPokemonRepo: Repository<UserPoketmon>,
  ) {}

  async giveStarterPokemon(userId: number) {
    const pikachu = await this.pokemonRepo.findOne({
      where: { name: 'Pikachu' },
    });
    if (!pikachu) throw new BadRequestException('Starter Pokemon not found');

    const userPokemon = this.userPokemonRepo.create({
      user_id: userId,
      pokemon_id: pikachu.id,
    });

    return this.userPokemonRepo.save(userPokemon);
  }

  async givePokemon(userId: number, pokemonId: number) {
    const pokemon = await this.pokemonRepo.findOne({
      where: { id: pokemonId },
    });
    if (!pokemon) throw new BadRequestException('Pokemon not found');

    const userPokemon = this.userPokemonRepo.create({
      user_id: userId,
      pokemon_id: pokemon.id,
    });

    return this.userPokemonRepo.save(userPokemon);
  }

  async getPokemonWithSkills(id: number) {
    const pokemon = await this.pokemonRepo.findOne({ where: { id } });
    if (!pokemon) return null;

    const skills = await this.pokemonSkillRepo.find({
      where: { pokemon_id: id },
    });

    return {
      ...pokemon,
      skills,
    };
  }

  async getUserPokemons(userId: number) {
    const userPokemons = await this.userPokemonRepo.find({
      where: { user_id: userId },
    });

    const results = await Promise.all(
      userPokemons.map(async (up) => {
        const pokemon = await this.pokemonRepo.findOne({
          where: { id: up.pokemon_id },
        });
        const skills = await this.pokemonSkillRepo.find({
          where: { pokemon_id: up.pokemon_id },
        });

        return {
          id: up.id,
          pokemon,
          skills,
          obtainedAt: up.created_at,
        };
      }),
    );

    return results;
  }
}
