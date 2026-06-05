import { BattleOutcome } from '../dto/simulate-battle-response.dto';
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
