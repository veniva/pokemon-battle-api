import { Injectable } from "@nestjs/common";
import { PokemonRepository } from "../pokemon.repository";
import { SimulateBattleRequestDto } from "../dto/simulate-battle-request.dto";

/** Simulates deterministic battles between two Pokemon teams. */
@Injectable()
export class PokemonBattleService {
  constructor(private readonly pokemonRepository: PokemonRepository) {}
  async simulateBattle(request: SimulateBattleRequestDto): Promise<void> {
    const resolvedPokemon = await this.pokemonRepository.findByIdentifiers([
      ...request.teamA.pokemon,
      ...request.teamB.pokemon,
    ]);
    // Split the result back to the original request order [teamA + teamB]
    const teamAResolutions = resolvedPokemon.slice(0, request.teamA.pokemon.length);
    const teamBResolutions = resolvedPokemon.slice(request.teamA.pokemon.length);
  }
}