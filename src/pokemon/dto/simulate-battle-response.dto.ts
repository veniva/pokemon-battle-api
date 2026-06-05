export type BattleOutcome = 'teamA' | 'teamB' | 'draw';

/** Compact Pokemon details included in battle responses. */
export class BattlePokemonSummaryDto {
  pokemonId!: number;
  dexNumber!: string;
  name!: string;
  types!: string[];
  heightMeters!: number;
  weightKg!: number;
  evolutionMultiplierAverage!: number | null;
  basePower!: number;
}

/** Team summary returned by a battle simulation. */
export class BattleTeamSummaryDto {
  key!: Exclude<BattleOutcome, 'draw'>;
  name!: string;
  pokemon!: BattlePokemonSummaryDto[];
  totalScore!: number;
  remainingPokemon!: number;
}

/** Explains how one side's types interacted with its opponent. */
export class BattleTypeEffectDto {
  multiplier!: number;
  matchedTypes!: string[];
}

/** Details one Pokemon's performance in a round. */
export class BattleRoundParticipantDto {
  teamKey!: Exclude<BattleOutcome, 'draw'>;
  teamName!: string;
  pokemon!: BattlePokemonSummaryDto;
  score!: number;
  fatigueMultiplier!: number;
  attackEffectiveness!: BattleTypeEffectDto;
  defensivePressure!: BattleTypeEffectDto;
}

/** A structured log entry for one simulated battle round. */
export class BattleRoundDto {
  round!: number;
  teamA!: BattleRoundParticipantDto;
  teamB!: BattleRoundParticipantDto;
  winner!: BattleOutcome;
  winnerName!: string | null;
}

/** Identifies the battle winner when one team wins outright. */
export class BattleWinnerDto {
  key!: Exclude<BattleOutcome, 'draw'>;
  name!: string;
}

/** Response returned by the battle simulation endpoint. */
export class SimulateBattleResponseDto {
  winner!: BattleWinnerDto | null;
  outcome!: BattleOutcome;
  teamA!: BattleTeamSummaryDto;
  teamB!: BattleTeamSummaryDto;
  rounds!: BattleRoundDto[];
  battleLog!: string[];
}
