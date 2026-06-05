import { Body, Controller, Post } from '@nestjs/common';
import { PokemonBattleService } from './battle/pokemon-battle.service';
import { SimulateBattleRequestDto } from './dto/simulate-battle-request.dto';

/** Exposes Pokemon gameplay endpoints. */
@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonBattleService: PokemonBattleService) {}

  /** Simulates a battle between two submitted Pokemon teams. */
  @Post('battles/simulate')
  simulateBattle(@Body() request: SimulateBattleRequestDto): Promise<void> {
    return this.pokemonBattleService.simulateBattle(request);
  }
}
