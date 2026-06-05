import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PokemonBattleService } from './battle/pokemon-battle.service';
import { SimulateBattleRequestDto } from './dto/simulate-battle-request.dto';
import { SimulateBattleResponseDto } from './dto/simulate-battle-response.dto';

/** Exposes Pokemon gameplay endpoints. */
@Controller('pokemon')
export class PokemonController {
  constructor(private readonly pokemonBattleService: PokemonBattleService) {}

  /** Simulates a battle between two submitted Pokemon teams. */
  @Post('battles/simulate')
  @HttpCode(HttpStatus.OK)
  simulateBattle(@Body() request: SimulateBattleRequestDto): Promise<SimulateBattleResponseDto> {
    return this.pokemonBattleService.simulateBattle(request);
  }
}
