import { Injectable } from '@nestjs/common';
import { SimulateBattleRequestDto } from '../dto/simulate-battle-request.dto';
import { BattleRoundDto, SimulateBattleResponseDto } from '../dto/simulate-battle-response.dto';
import { PokemonRepository } from '../pokemon.repository';
import {
  applyFatigue,
  assertAllPokemonResolved,
  countRemainingPokemon,
  createFinalLogEntry,
  createTeamState,
  createTeamSummary,
  determineBattleOutcome,
  formatPokemonNames,
  getNextFighter,
  round,
  simulateRound,
  unwrapPokemon,
} from './pokemon-battle.helpers';

/** Simulates deterministic battles between two Pokemon teams. */
@Injectable()
export class PokemonBattleService {
  constructor(private readonly pokemonRepository: PokemonRepository) {}
  async simulateBattle(request: SimulateBattleRequestDto): Promise<SimulateBattleResponseDto> {
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

    let activeA = getNextFighter(teamA);
    let activeB = getNextFighter(teamB);
    let roundNumber = 1;

    while (activeA && activeB) {
      const roundResult = simulateRound(roundNumber, teamA, activeA, teamB, activeB);

      rounds.push(roundResult.round);
      battleLog.push(roundResult.battleLogEntry);
      teamA.totalScore = round(teamA.totalScore + roundResult.teamAScore);
      teamB.totalScore = round(teamB.totalScore + roundResult.teamBScore);

      if (roundResult.winner === 'draw') {
        activeA = getNextFighter(teamA);
        activeB = getNextFighter(teamB);
      } else if (roundResult.winner === 'teamA') {
        applyFatigue(activeA);
        activeB = getNextFighter(teamB);
      } else {
        applyFatigue(activeB);
        activeA = getNextFighter(teamA);
      }

      roundNumber += 1;
    }

    const teamARemaining = countRemainingPokemon(teamA, activeA);
    const teamBRemaining = countRemainingPokemon(teamB, activeB);
    const outcome = determineBattleOutcome(teamA, teamARemaining, teamB, teamBRemaining);
    const winner =
      outcome === 'draw'
        ? null
        : {
            key: outcome,
            name: outcome === 'teamA' ? teamA.name : teamB.name,
          };

    battleLog.push(createFinalLogEntry(outcome, teamA, teamARemaining, teamB, teamBRemaining));

    return {
      winner,
      outcome,
      teamA: createTeamSummary(teamA, teamARemaining),
      teamB: createTeamSummary(teamB, teamBRemaining),
      rounds,
      battleLog,
    };
  }
}
