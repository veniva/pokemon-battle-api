import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PokemonBattleService } from './battle/pokemon-battle.service';
import { PokemonController } from './pokemon.controller';
import { PokemonRepository } from './pokemon.repository';
import { Pokemon, PokemonSchema } from './pokemon.schema';

/** Groups Pokemon data access and gameplay features. */
@Module({
  imports: [MongooseModule.forFeature([{ name: Pokemon.name, schema: PokemonSchema }])],
  controllers: [PokemonController],
  providers: [PokemonBattleService, PokemonRepository],
})
export class PokemonModule {}
