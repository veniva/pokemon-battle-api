import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PokemonDataset } from './cli/seed/pokemon.dataset';
import { MongoConfigModule } from './database/mongo-config.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MongoConfigModule],
  controllers: [AppController],
  providers: [AppService, PokemonDataset],
})
export class AppModule {}
