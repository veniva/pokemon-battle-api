import { Injectable } from '@nestjs/common';
import { SimulateBattleRequestDto } from '../dto/simulate-battle-request.dto';
import { BattleRoundDto } from '../dto/simulate-battle-response.dto';
import { PokemonRepository } from '../pokemon.repository';
import { assertAllPokemonResolved, createTeamState, formatPokemonNames, unwrapPokemon } from './pokemon-battle.helpers';

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

    assertAllPokemonResolved([
      { teamName: request.teamA.name ?? 'Team A', resolutions: teamAResolutions },
      { teamName: request.teamB.name ?? 'Team B', resolutions: teamBResolutions },
    ]);

    const teamA = createTeamState('teamA', request.teamA.name ?? 'Team A', unwrapPokemon(teamAResolutions));
    const teamB = createTeamState('teamB', request.teamB.name ?? 'Team B', unwrapPokemon(teamBResolutions));

    const rounds: BattleRoundDto[] = [];
    const battleLog: string[] = [
      `${teamA.name} enters with ${formatPokemonNames(teamA.fighters)}.`,
      `${teamB.name} enters with ${formatPokemonNames(teamB.fighters)}.`,
    ];
  }
}
