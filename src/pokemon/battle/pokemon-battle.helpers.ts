import { NotFoundException } from '@nestjs/common';
import { PokemonIdentifierResolution } from '../pokemon.repository';
import { Pokemon } from '../pokemon.schema';
import { TeamKey, BattleTeamState, FighterState } from './battle-models';

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

/** Rounds scoring values for stable API responses and tests. */
export function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Formats fighter names for the opening battle log entries. */
export function formatPokemonNames(fighters: FighterState[]): string {
  return fighters.map((fighter) => fighter.pokemon.name).join(', ');
}
