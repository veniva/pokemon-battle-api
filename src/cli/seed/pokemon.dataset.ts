import { Injectable } from '@nestjs/common';
import type { EvolutionLink, Pokemon } from '../../pokemon/pokemon.schema';

/** Represents the top-level shape of data/pokemon.json. */
export interface PokemonDatasetFile {
  pokemon: PokemonDatasetItem[];
}

/** Represents one evolution reference in the source dataset. */
export interface PokemonDatasetEvolution {
  num: string;
  name: string;
}

/** Represents one Pokemon record in the source dataset. */
export interface PokemonDatasetItem {
  id: number;
  num: string;
  name: string;
  img: string;
  type: string[];
  height: string;
  weight: string;
  candy: string;
  candy_count?: number;
  egg: string;
  spawn_chance: number;
  avg_spawns: number;
  spawn_time: string;
  multipliers: number[] | null;
  weaknesses: string[];
  prev_evolution?: PokemonDatasetEvolution[];
  next_evolution?: PokemonDatasetEvolution[];
}

/** Converts source Pokemon dataset records into normalized database documents. */
@Injectable()
export class PokemonDataset {
  /** Converts a parsed Pokemon dataset file into normalized database documents. */
  createSeedDocuments(dataset: PokemonDatasetFile, importedAt = new Date()): Pokemon[] {
    if (!dataset || !Array.isArray(dataset.pokemon)) {
      throw new Error('Pokemon dataset must contain a pokemon array.');
    }

    return dataset.pokemon.map((pokemon) => this.toSeedDocument(pokemon, importedAt));
  }

  /** Converts one source Pokemon record into the MongoDB document shape used by the app. */
  toSeedDocument(pokemon: PokemonDatasetItem, importedAt = new Date()): Pokemon {
    const multipliers = this.normalizeNumberArray(pokemon.multipliers ?? [], `Pokemon ${pokemon.num} multipliers`);

    return {
      pokemonId: this.assertFiniteNumber(pokemon.id, `Pokemon ${pokemon.num} id`),
      dexNumber: this.assertNonBlankString(pokemon.num, `Pokemon ${pokemon.id} num`),
      name: this.assertNonBlankString(pokemon.name, `Pokemon ${pokemon.num} name`),
      normalizedName: this.normalizeName(pokemon.name),
      imageUrl: this.assertNonBlankString(pokemon.img, `Pokemon ${pokemon.num} img`),
      types: this.normalizeStringArray(pokemon.type, `Pokemon ${pokemon.num} type`),
      heightMeters: this.parseRequiredMetricValue(pokemon.height, 'm', `Pokemon ${pokemon.num} height`),
      weightKg: this.parseRequiredMetricValue(pokemon.weight, 'kg', `Pokemon ${pokemon.num} weight`),
      candy: this.assertNonBlankString(pokemon.candy, `Pokemon ${pokemon.num} candy`),
      candyCount: this.normalizeOptionalNumber(pokemon.candy_count, `Pokemon ${pokemon.num} candy_count`),
      egg: this.assertNonBlankString(pokemon.egg, `Pokemon ${pokemon.num} egg`),
      eggDistanceKm: this.parseOptionalMetricValue(pokemon.egg, 'km'),
      spawnChance: this.assertFiniteNumber(pokemon.spawn_chance, `Pokemon ${pokemon.num} spawn_chance`),
      averageSpawns: this.assertFiniteNumber(pokemon.avg_spawns, `Pokemon ${pokemon.num} avg_spawns`),
      spawnTime: this.normalizeSpawnTime(pokemon.spawn_time),
      multipliers,
      evolutionMultiplierAverage: this.calculateAverage(multipliers),
      weaknesses: this.normalizeStringArray(pokemon.weaknesses, `Pokemon ${pokemon.num} weaknesses`),
      previousEvolutions: this.normalizeEvolutionLinks(pokemon.prev_evolution, `Pokemon ${pokemon.num} prev_evolution`),
      nextEvolutions: this.normalizeEvolutionLinks(pokemon.next_evolution, `Pokemon ${pokemon.num} next_evolution`),
      importedAt,
    };
  }

  /** Normalizes names for case-insensitive exact lookups. */
  normalizeName(name: string): string {
    return this.assertNonBlankString(name, 'Pokemon name').toLowerCase();
  }

  /** Parses a required metric string such as "6.9 kg" into its numeric value. */
  parseRequiredMetricValue(value: string, expectedUnit: string, fieldName: string): number {
    const parsedValue = this.parseOptionalMetricValue(value, expectedUnit);

    if (parsedValue === null) {
      throw new Error(`${fieldName} must be a numeric value followed by "${expectedUnit}".`);
    }

    return parsedValue;
  }

  /** Parses an optional metric string and returns null when the value is not represented in the expected unit. */
  parseOptionalMetricValue(value: string, expectedUnit: string): number | null {
    const match = this.assertNonBlankString(value, 'Metric value').match(/^(\d+(?:\.\d+)?)\s+([A-Za-z]+)$/);

    if (!match || match[2] !== expectedUnit) {
      return null;
    }

    return Number(match[1]);
  }

  /** Converts Pokemon Go's N/A spawn placeholder into a database null. */
  normalizeSpawnTime(value: string): string | null {
    const spawnTime = this.assertNonBlankString(value, 'Pokemon spawn_time');

    return spawnTime === 'N/A' ? null : spawnTime;
  }

  /** Normalizes optional evolution links into an array of compact references. */
  private normalizeEvolutionLinks(
    evolutions: PokemonDatasetEvolution[] | undefined,
    fieldName: string,
  ): EvolutionLink[] {
    if (evolutions === undefined) {
      return [];
    }

    if (!Array.isArray(evolutions)) {
      throw new Error(`${fieldName} must be an array when provided.`);
    }

    return evolutions.map((evolution) => ({
      num: this.assertNonBlankString(evolution.num, `${fieldName} num`),
      name: this.assertNonBlankString(evolution.name, `${fieldName} name`),
    }));
  }

  /** Normalizes a required string array and rejects empty values. */
  private normalizeStringArray(value: string[], fieldName: string): string[] {
    if (!Array.isArray(value) || value.length === 0) {
      throw new Error(`${fieldName} must be a non-empty array.`);
    }

    return value.map((item) => this.assertNonBlankString(item, fieldName));
  }

  /** Normalizes an array of finite numeric values. */
  private normalizeNumberArray(value: number[], fieldName: string): number[] {
    if (!Array.isArray(value)) {
      throw new Error(`${fieldName} must be an array.`);
    }

    return value.map((item) => this.assertFiniteNumber(item, fieldName));
  }

  /** Normalizes an optional finite numeric value. */
  private normalizeOptionalNumber(value: number | undefined, fieldName: string): number | undefined {
    return value === undefined ? undefined : this.assertFiniteNumber(value, fieldName);
  }

  /** Asserts that a value is a finite number. */
  private assertFiniteNumber(value: number, fieldName: string): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`${fieldName} must be a finite number.`);
    }

    return value;
  }

  /** Asserts that a value is a non-empty string and returns its trimmed form. */
  private assertNonBlankString(value: string, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`${fieldName} must be a non-empty string.`);
    }

    return value.trim();
  }

  /** Calculates an average for non-empty numeric arrays. */
  private calculateAverage(values: number[]): number | null {
    if (values.length === 0) {
      return null;
    }

    return values.reduce((total, value) => total + value, 0) / values.length;
  }
}
