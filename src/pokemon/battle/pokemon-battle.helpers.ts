import { NotFoundException } from '@nestjs/common';
import { PokemonIdentifierResolution } from '../pokemon.repository';
import { Pokemon } from '../pokemon.schema';
import { TeamKey, BattleTeamState, FighterState, ParticipantScore, RoundResult } from './pokemon-battle.models';
import {
  BattleRoundDto,
  BattleTypeEffectDto,
  BattleOutcome,
  BattleRoundParticipantDto,
  BattlePokemonSummaryDto,
  BattleTeamSummaryDto,
} from '../dto/simulate-battle-response.dto';

const FATIGUE_LOSS_PER_WIN = 0.08;
const MINIMUM_FATIGUE_MULTIPLIER = 0.7;

/** Converts resolved repository results into a Pokemon array after the missing-data guard has run. */
export function unwrapPokemon(resolutions: PokemonIdentifierResolution[]): Pokemon[] {
  return resolutions.map((resolution) => resolution.pokemon as Pokemon);
}

/** Throws a 404 that groups every unresolved Pokemon identifier by team. */
export function assertAllPokemonResolved(
  teams: { teamName: string; resolutions: PokemonIdentifierResolution[] }[],
): void {
  const missingSegments = teams
    .map(({ teamName, resolutions }) => {
      const missingIdentifiers = resolutions
        .filter((resolution) => resolution.pokemon === null)
        .map((resolution) => resolution.identifier);

      return missingIdentifiers.length > 0 ? `${teamName}: ${missingIdentifiers.join(', ')}` : null;
    })
    .filter((segment): segment is string => segment !== null);

  if (missingSegments.length > 0) {
    throw new NotFoundException(`Pokemon not found for ${missingSegments.join('; ')}`);
  }
}

/** Creates mutable simulation state for a team. */
export function createTeamState(key: TeamKey, name: string, pokemon: Pokemon[]): BattleTeamState {
  return {
    key,
    name,
    fighters: pokemon.map((item) => ({
      pokemon: item,
      basePower: calculateBasePower(item),
      fatigueMultiplier: 1,
    })),
    nextFighterIndex: 0,
    totalScore: 0,
  };
}

/** Rounds scoring values for stable API responses and tests. */
export function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Formats fighter names for the opening battle log entries. */
export function formatPokemonNames(fighters: FighterState[]): string {
  return fighters.map((fighter) => fighter.pokemon.name).join(', ');
}
/** Gets the next available fighter for a team. */
export function getNextFighter(team: BattleTeamState): FighterState | null {
  const fighter = team.fighters[team.nextFighterIndex];

  if (!fighter) {
    return null;
  }

  team.nextFighterIndex += 1;

  return fighter;
}

/** Simulates one head-to-head round between active Pokemon. */
export function simulateRound(
  roundNumber: number,
  teamA: BattleTeamState,
  activeA: FighterState,
  teamB: BattleTeamState,
  activeB: FighterState,
): RoundResult {
  const teamAScore = scoreParticipant(activeA, activeB);
  const teamBScore = scoreParticipant(activeB, activeA);
  const winner = determineRoundWinner(teamAScore.score, teamBScore.score);
  const winnerName = winner === 'draw' ? null : winner === 'teamA' ? teamAScore.pokemon.name : teamBScore.pokemon.name;
  const round: BattleRoundDto = {
    round: roundNumber,
    teamA: createRoundParticipant(teamA, teamAScore),
    teamB: createRoundParticipant(teamB, teamBScore),
    winner,
    winnerName,
  };

  return {
    round,
    winner,
    teamAScore: teamAScore.score,
    teamBScore: teamBScore.score,
    battleLogEntry: createRoundLogEntry(roundNumber, teamAScore, teamBScore, winnerName),
  };
}

/** Applies fatigue to a Pokemon that survived a round. */
export function applyFatigue(fighter: FighterState): void {
  fighter.fatigueMultiplier = Math.max(
    MINIMUM_FATIGUE_MULTIPLIER,
    round(fighter.fatigueMultiplier - FATIGUE_LOSS_PER_WIN),
  );
}

/** Determines the overall battle outcome after one or both teams run out of Pokemon. */
export function determineBattleOutcome(
  teamA: BattleTeamState,
  teamARemaining: number,
  teamB: BattleTeamState,
  teamBRemaining: number,
): BattleOutcome {
  if (teamARemaining > 0 && teamBRemaining === 0) {
    return 'teamA';
  }

  if (teamBRemaining > 0 && teamARemaining === 0) {
    return 'teamB';
  }

  if (teamA.totalScore === teamB.totalScore) {
    return 'draw';
  }

  return teamA.totalScore > teamB.totalScore ? 'teamA' : 'teamB';
}

/** Counts active and waiting Pokemon for a team. */
export function countRemainingPokemon(team: BattleTeamState, activeFighter: FighterState | null): number {
  const waitingPokemon = Math.max(0, team.fighters.length - team.nextFighterIndex);

  return waitingPokemon + (activeFighter ? 1 : 0);
}

/** Creates response data for a team after the battle. */
export function createTeamSummary(team: BattleTeamState, remainingPokemon: number): BattleTeamSummaryDto {
  return {
    key: team.key,
    name: team.name,
    pokemon: team.fighters.map((fighter) => createPokemonSummary(fighter)),
    totalScore: team.totalScore,
    remainingPokemon,
  };
}

/** Builds the final readable battle log entry. */
export function createFinalLogEntry(
  outcome: BattleOutcome,
  teamA: BattleTeamState,
  teamARemaining: number,
  teamB: BattleTeamState,
  teamBRemaining: number,
): string {
  if (outcome === 'draw') {
    return `Battle ends in a draw with final scores ${teamA.totalScore} to ${teamB.totalScore}.`;
  }

  const winner = outcome === 'teamA' ? teamA : teamB;

  return (
    `${winner.name} wins the battle. Final score: ${teamA.name} ${teamA.totalScore}, ` +
    `${teamB.name} ${teamB.totalScore}. Remaining Pokemon: ${teamA.name} ${teamARemaining}, ` +
    `${teamB.name} ${teamBRemaining}.`
  );
}

/** Calculates base power from dataset stats before matchup-specific adjustments. */
function calculateBasePower(pokemon: Pokemon): number {
  const physicalPower = Math.sqrt(pokemon.weightKg) * 5 + pokemon.heightMeters * 10;
  const evolutionStagePower = ((pokemon.previousEvolutions?.length ?? 0) + 1) * 8;
  const evolutionPotentialPower = (pokemon.evolutionMultiplierAverage ?? 1) * 10;
  const rarityPower = Math.min(24, Math.log10(1 / Math.max(pokemon.spawnChance, 0.001)) * 8);
  const activityPower = Math.min(10, pokemon.averageSpawns * 0.08);
  const typeCoveragePower = pokemon.types.length * 5;

  return round(
    20 +
      physicalPower +
      evolutionStagePower +
      evolutionPotentialPower +
      rarityPower +
      activityPower +
      typeCoveragePower,
  );
}

/** Scores one active Pokemon against its opponent for the current round. */
function scoreParticipant(fighter: FighterState, opponent: FighterState): ParticipantScore {
  const attackEffectiveness = calculateTypeEffect(fighter.pokemon.types, opponent.pokemon.weaknesses);
  const defensivePressure = calculateTypeEffect(opponent.pokemon.types, fighter.pokemon.weaknesses);
  const fatiguedPower = fighter.basePower * fighter.fatigueMultiplier;
  const score = round((fatiguedPower * attackEffectiveness.multiplier) / defensivePressure.multiplier);

  return {
    pokemon: fighter.pokemon,
    basePower: fighter.basePower,
    score,
    fatigueMultiplier: round(fighter.fatigueMultiplier),
    attackEffectiveness,
    defensivePressure,
  };
}

/** Calculates type pressure from attacker types that appear in defender weaknesses. */
function calculateTypeEffect(attackerTypes: string[], defenderWeaknesses: string[]): BattleTypeEffectDto {
  const normalizedWeaknesses = new Set(defenderWeaknesses.map((weakness) => weakness.toLowerCase()));
  const matchedTypes = attackerTypes.filter((type) => normalizedWeaknesses.has(type.toLowerCase()));

  return {
    multiplier: round(1 + matchedTypes.length * 0.25),
    matchedTypes,
  };
}

/** Determines the winner for one round. */
function determineRoundWinner(teamAScore: number, teamBScore: number): BattleOutcome {
  if (teamAScore === teamBScore) {
    return 'draw';
  }

  return teamAScore > teamBScore ? 'teamA' : 'teamB';
}

/** Creates response data for one round participant. */
function createRoundParticipant(team: BattleTeamState, score: ParticipantScore): BattleRoundParticipantDto {
  return {
    teamKey: team.key,
    teamName: team.name,
    pokemon: createPokemonSummary({
      pokemon: score.pokemon,
      basePower: score.basePower,
      fatigueMultiplier: score.fatigueMultiplier,
    }),
    score: score.score,
    fatigueMultiplier: score.fatigueMultiplier,
    attackEffectiveness: score.attackEffectiveness,
    defensivePressure: score.defensivePressure,
  };
}

/** Creates compact Pokemon response data with scoring inputs. */
function createPokemonSummary(fighter: FighterState): BattlePokemonSummaryDto {
  return {
    pokemonId: fighter.pokemon.pokemonId,
    dexNumber: fighter.pokemon.dexNumber,
    name: fighter.pokemon.name,
    types: fighter.pokemon.types,
    heightMeters: fighter.pokemon.heightMeters,
    weightKg: fighter.pokemon.weightKg,
    evolutionMultiplierAverage: fighter.pokemon.evolutionMultiplierAverage,
    basePower: fighter.basePower,
  };
}

/** Builds a readable round log entry. */
function createRoundLogEntry(
  roundNumber: number,
  teamAScore: ParticipantScore,
  teamBScore: ParticipantScore,
  winnerName: string | null,
): string {
  const resultText = winnerName ? `${winnerName} wins the round.` : 'Both Pokemon are knocked out in a draw.';

  return (
    `Round ${roundNumber}: ${teamAScore.pokemon.name} scores ${teamAScore.score} ` +
    `(base ${teamAScore.basePower}, attack x${teamAScore.attackEffectiveness.multiplier}, ` +
    `defense pressure x${teamAScore.defensivePressure.multiplier}, fatigue x${teamAScore.fatigueMultiplier}) ` +
    `against ${teamBScore.pokemon.name}; ${teamBScore.pokemon.name} scores ${teamBScore.score} ` +
    `(base ${teamBScore.basePower}, attack x${teamBScore.attackEffectiveness.multiplier}, ` +
    `defense pressure x${teamBScore.defensivePressure.multiplier}, fatigue x${teamBScore.fatigueMultiplier}). ` +
    resultText
  );
}
