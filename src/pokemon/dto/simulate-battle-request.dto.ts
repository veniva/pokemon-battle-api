import { Type } from 'class-transformer';
import { IsDefined, ValidateNested } from 'class-validator';
import { BattleTeamDto } from './battle-team.dto';

/** Request payload for simulating a battle between two Pokemon teams. */
export class SimulateBattleRequestDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => BattleTeamDto)
  teamA!: BattleTeamDto;

  @IsDefined()
  @ValidateNested()
  @Type(() => BattleTeamDto)
  teamB!: BattleTeamDto;
}