import { NotFoundException } from '@nestjs/common';
import { PokemonBattleService } from './pokemon-battle.service';
import { type Pokemon } from '../pokemon.schema';
import { type PokemonRepository } from '../pokemon.repository';

describe('PokemonBattleService', () => {
  it('simulates a deterministic battle with type effectiveness and a detailed log', async () => {
    const service = new PokemonBattleService(createRepository([bulbasaur, charmander, squirtle]));

    const result = await service.simulateBattle({
      teamA: {
        name: 'Leaf Squad',
        pokemon: ['Bulbasaur', 'Squirtle'],
      },
      teamB: {
        name: 'Fire Squad',
        pokemon: ['Charmander'],
      },
    });

    expect(result.outcome).toBe('teamA');
    expect(result.winner).toEqual({ key: 'teamA', name: 'Leaf Squad' });
    expect(result.rounds).toHaveLength(2);
    expect(result.rounds[0].teamB.attackEffectiveness.matchedTypes).toEqual(['Fire']);
    expect(result.rounds[1].teamA.attackEffectiveness.matchedTypes).toEqual(['Water']);
    expect(result.battleLog).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Leaf Squad enters with Bulbasaur, Squirtle.'),
        expect.stringContaining('Round 1: Bulbasaur scores'),
        expect.stringContaining('Squirtle wins the round.'),
      ]),
    );
  });

  it('throws a not found error when a submitted Pokemon cannot be resolved', async () => {
    const service = new PokemonBattleService(createRepository([bulbasaur]));

    await expect(
      service.simulateBattle({
        teamA: {
          pokemon: ['Bulbasaur'],
        },
        teamB: {
          pokemon: ['MissingNo'],
        },
      }),
    ).rejects.toThrow(NotFoundException);
  });
});

/** Creates a fake repository that supports the same identifier forms as the Mongo repository. */
function createRepository(pokemon: Pokemon[]): PokemonRepository {
  return {
    findByIdentifiers: jest.fn((identifiers: readonly string[]) =>
      Promise.resolve(
        identifiers.map((identifier) => ({
          identifier,
          pokemon: findPokemon(pokemon, identifier),
        })),
      ),
    ),
  } as unknown as PokemonRepository;
}

/** Finds a Pokemon fixture by name, dex number, or numeric id. */
function findPokemon(pokemon: Pokemon[], identifier: string): Pokemon | null {
  const trimmedIdentifier = identifier.trim();
  const numericIdentifier = /^\d+$/.test(trimmedIdentifier) ? Number(trimmedIdentifier) : null;
  const dexNumber = numericIdentifier === null ? null : trimmedIdentifier.padStart(3, '0');

  return (
    pokemon.find(
      (item) =>
        item.normalizedName === trimmedIdentifier.toLowerCase() ||
        item.dexNumber === dexNumber ||
        item.pokemonId === numericIdentifier,
    ) ?? null
  );
}

const basePokemon = {
  imageUrl: 'https://example.com/pokemon.png',
  candy: 'Pokemon Candy',
  candyCount: 25,
  egg: '2 km',
  eggDistanceKm: 2,
  spawnChance: 0.25,
  averageSpawns: 25,
  spawnTime: '12:00',
  multipliers: [1.5],
  evolutionMultiplierAverage: 1.5,
  previousEvolutions: [],
  nextEvolutions: [],
  importedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const bulbasaur: Pokemon = {
  ...basePokemon,
  pokemonId: 1,
  dexNumber: '001',
  name: 'Bulbasaur',
  normalizedName: 'bulbasaur',
  types: ['Grass', 'Poison'],
  heightMeters: 0.71,
  weightKg: 6.9,
  spawnChance: 0.69,
  averageSpawns: 69,
  weaknesses: ['Fire', 'Ice', 'Flying', 'Psychic'],
};

const charmander: Pokemon = {
  ...basePokemon,
  pokemonId: 4,
  dexNumber: '004',
  name: 'Charmander',
  normalizedName: 'charmander',
  types: ['Fire'],
  heightMeters: 0.61,
  weightKg: 8.5,
  spawnChance: 0.253,
  averageSpawns: 25.3,
  weaknesses: ['Water', 'Ground', 'Rock'],
};

const squirtle: Pokemon = {
  ...basePokemon,
  pokemonId: 7,
  dexNumber: '007',
  name: 'Squirtle',
  normalizedName: 'squirtle',
  types: ['Water'],
  heightMeters: 0.51,
  weightKg: 9,
  spawnChance: 0.58,
  averageSpawns: 58,
  weaknesses: ['Electric', 'Grass'],
};
