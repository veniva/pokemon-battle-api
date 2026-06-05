import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model } from 'mongoose';
import { Pokemon, type PokemonDocument } from './pokemon.schema';

/** Represents the result of resolving one user-provided Pokemon identifier. */
export interface PokemonIdentifierResolution {
  identifier: string;
  pokemon: Pokemon | null;
}

interface PokemonIdentifierLookup {
  identifier: string;
  normalizedName: string;
  dexNumber?: string;
  pokemonId?: number;
}

/** Reads Pokemon documents needed by application features. */
@Injectable()
export class PokemonRepository {
  constructor(@InjectModel(Pokemon.name) private readonly pokemonModel: Model<PokemonDocument>) {}

  /**
   * Surch by various identifiers: names, Pokedex numbers, or numeric Pokemon ids.
   * Preserves input order, so that the found Pokemons can be split back to teams using the original request.
   * @param identifiers A combined array of TeamA + TeamB player identifiers
   */
  async findByIdentifiers(identifiers: readonly string[]): Promise<PokemonIdentifierResolution[]> {
    // Infer the possible identifiers.
    const lookups = identifiers.map((identifier) => this.createLookup(identifier));
    const normalizedNames = this.unique(lookups.map((lookup) => lookup.normalizedName));
    const dexNumbers = this.unique(lookups.flatMap((lookup) => (lookup.dexNumber ? [lookup.dexNumber] : [])));
    const pokemonIds = this.unique(lookups.flatMap((lookup) => (lookup.pokemonId ? [lookup.pokemonId] : [])));
    const filters: Record<string, unknown>[] = [];

    if (normalizedNames.length > 0) {
      filters.push({ normalizedName: { $in: normalizedNames } });
    }

    if (dexNumbers.length > 0) {
      filters.push({ dexNumber: { $in: dexNumbers } });
    }

    if (pokemonIds.length > 0) {
      filters.push({ pokemonId: { $in: pokemonIds } });
    }

    const pokemon = filters.length > 0 ? await this.pokemonModel.find({ $or: filters }).lean<Pokemon[]>().exec() : [];

    const byAnyIdentifier = new Map<string, Pokemon>();
    for (const item of pokemon) {
      byAnyIdentifier.set(`name:${item.normalizedName}`, item);
      byAnyIdentifier.set(`dex:${item.dexNumber}`, item);
      byAnyIdentifier.set(`id:${item.pokemonId}`, item);
    }

    return lookups.map((lookup) => {
      const resolvedPokemon =
        byAnyIdentifier.get(`name:${lookup.normalizedName}`) ??
        (lookup.dexNumber ? byAnyIdentifier.get(`dex:${lookup.dexNumber}`) : undefined) ??
        (lookup.pokemonId ? byAnyIdentifier.get(`id:${lookup.pokemonId}`) : undefined) ??
        null;

      return {
        identifier: lookup.identifier,
        pokemon: resolvedPokemon,
      };
    });
  }

  /** Creates every lookup shape supported by the battle API. */
  private createLookup(identifier: string): PokemonIdentifierLookup {
    const trimmedIdentifier = identifier.trim();
    const isNumericIdentifier = /^\d+$/.test(trimmedIdentifier);
    const pokemonId = isNumericIdentifier ? Number(trimmedIdentifier) : undefined;

    return {
      identifier: trimmedIdentifier,
      normalizedName: trimmedIdentifier.toLowerCase(),
      dexNumber: isNumericIdentifier ? trimmedIdentifier.padStart(3, '0') : undefined,
      pokemonId: pokemonId !== undefined && Number.isSafeInteger(pokemonId) ? pokemonId : undefined,
    };
  }

  /** Returns unique values while preserving their first occurrence order. */
  private unique<T>(values: T[]): T[] {
    return [...new Set(values)];
  }
}
