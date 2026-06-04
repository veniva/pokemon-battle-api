import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getConnectionToken } from '@nestjs/mongoose';
import { type AnyBulkWriteOperation, type Connection, type Model } from 'mongoose';
import { AppModule } from '../../app.module';
import { Pokemon, POKEMON_COLLECTION, PokemonSchema } from '../../pokemon/pokemon.schema';
import { PokemonDataset, type PokemonDatasetFile } from './pokemon.dataset';

const DEFAULT_DATASET_PATH = './data/pokemon.json';

/** Summarizes a completed Pokemon seed run. */
interface SeedPokemonResult {
  datasetPath: string;
  totalDocuments: number;
  insertedCount: number;
  matchedCount: number;
  modifiedCount: number;
  deletedStaleCount: number;
}

/** Seeds MongoDB with the normalized Pokemon dataset used by battle simulation features. */
export async function seedPokemon(): Promise<SeedPokemonResult> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const configService = app.get(ConfigService);
    const pokemonDataset = app.get(PokemonDataset);
    const connection = app.get<Connection>(getConnectionToken());
    const configuredDatasetPath = getConfigValue(configService, 'POKEMON_DATASET_PATH', DEFAULT_DATASET_PATH);
    const datasetPath = resolve(process.cwd(), configuredDatasetPath);
    const pokemonDocuments = pokemonDataset.createSeedDocuments(readPokemonDataset(datasetPath));
    const pokemonIds = pokemonDocuments.map((pokemon) => pokemon.pokemonId);
    const PokemonModel = getPokemonModel(connection);

    await PokemonModel.createIndexes();

    const operations: AnyBulkWriteOperation<Pokemon>[] = pokemonDocuments.map((pokemon) => ({
      updateOne: {
        filter: { pokemonId: pokemon.pokemonId },
        update: { $set: pokemon },
        upsert: true,
      },
    }));
    const result = await PokemonModel.bulkWrite(operations, { ordered: false });
    const staleResult = await PokemonModel.deleteMany({ pokemonId: { $nin: pokemonIds } });

    return {
      datasetPath,
      totalDocuments: pokemonDocuments.length,
      insertedCount: result.upsertedCount,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      deletedStaleCount: staleResult.deletedCount,
    };
  } finally {
    await app.close();
  }
}

/** Reads and parses the source Pokemon dataset from disk. */
function readPokemonDataset(datasetPath: string): PokemonDatasetFile {
  try {
    return JSON.parse(readFileSync(datasetPath, 'utf8')) as PokemonDatasetFile;
  } catch (error) {
    throw new Error(`Failed to read Pokemon dataset from ${datasetPath}: ${formatError(error)}`);
  }
}

/** Reads a trimmed environment value with a fallback. */
function getConfigValue(configService: ConfigService, name: string, fallback: string): string {
  const value = configService.get<string>(name, fallback).trim();

  return value || fallback;
}

/** Gets the Pokemon model from the Nest-managed Mongoose connection. */
function getPokemonModel(connection: Connection): Model<Pokemon> {
  const existingModel = connection.models[Pokemon.name] as Model<Pokemon> | undefined;

  return existingModel ?? connection.model<Pokemon>(Pokemon.name, PokemonSchema, POKEMON_COLLECTION);
}

/** Formats unknown thrown values for CLI output. */
function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

if (require.main === module) {
  seedPokemon()
    .then((result) => {
      console.log(
        `Seeded ${result.totalDocuments} Pokemon from ${result.datasetPath}. ` +
          `Inserted: ${result.insertedCount}, matched: ${result.matchedCount}, ` +
          `modified: ${result.modifiedCount}, removed stale: ${result.deletedStaleCount}.`,
      );
    })
    .catch((error) => {
      console.error(`Pokemon seed failed: ${formatError(error)}`);
      process.exitCode = 1;
    });
}
