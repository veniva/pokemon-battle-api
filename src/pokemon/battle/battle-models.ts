import { BattleOutcome, BattleRoundDto, BattleTypeEffectDto } from '../dto/simulate-battle-response.dto';
import { Pokemon } from '../pokemon.schema';

export type TeamKey = Exclude<BattleOutcome, 'draw'>;

export interface FighterState {
  pokemon: Pokemon;
  basePower: number;
  fatigueMultiplier: number;
}

export interface BattleTeamState {
  key: TeamKey;
  name: string;
  fighters: FighterState[];
  nextFighterIndex: number;
  totalScore: number;
}

export interface RoundResult {
  round: BattleRoundDto;
  winner: BattleOutcome;
  teamAScore: number;
  teamBScore: number;
  battleLogEntry: string;
}

export interface ParticipantScore {
  pokemon: Pokemon;
  basePower: number;
  score: number;
  fatigueMultiplier: number;
  attackEffectiveness: BattleTypeEffectDto;
  defensivePressure: BattleTypeEffectDto;
}
