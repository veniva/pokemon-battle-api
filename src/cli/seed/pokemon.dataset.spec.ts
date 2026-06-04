import { PokemonDataset, type PokemonDatasetItem } from './pokemon.dataset';

describe('pokemon dataset mapping', () => {
  const dataset = new PokemonDataset();
  const importedAt = new Date('2026-01-01T00:00:00.000Z');
  const basePokemon: PokemonDatasetItem = {
    id: 1,
    num: '001',
    name: 'Bulbasaur',
    img: 'http://www.serebii.net/pokemongo/pokemon/001.png',
    type: ['Grass', 'Poison'],
    height: '0.71 m',
    weight: '6.9 kg',
    candy: 'Bulbasaur Candy',
    candy_count: 25,
    egg: '2 km',
    spawn_chance: 0.69,
    avg_spawns: 69,
    spawn_time: '20:00',
    multipliers: [1.58],
    weaknesses: ['Fire', 'Ice', 'Flying', 'Psychic'],
    next_evolution: [
      {
        num: '002',
        name: 'Ivysaur',
      },
    ],
  };

  it('normalizes a source record into the seeded MongoDB shape', () => {
    expect(dataset.toSeedDocument(basePokemon, importedAt)).toEqual({
      pokemonId: 1,
      dexNumber: '001',
      name: 'Bulbasaur',
      normalizedName: 'bulbasaur',
      imageUrl: 'http://www.serebii.net/pokemongo/pokemon/001.png',
      types: ['Grass', 'Poison'],
      heightMeters: 0.71,
      weightKg: 6.9,
      candy: 'Bulbasaur Candy',
      candyCount: 25,
      egg: '2 km',
      eggDistanceKm: 2,
      spawnChance: 0.69,
      averageSpawns: 69,
      spawnTime: '20:00',
      multipliers: [1.58],
      evolutionMultiplierAverage: 1.58,
      weaknesses: ['Fire', 'Ice', 'Flying', 'Psychic'],
      previousEvolutions: [],
      nextEvolutions: [
        {
          num: '002',
          name: 'Ivysaur',
        },
      ],
      importedAt,
    });
  });

  it('uses nulls and empty arrays for unavailable optional battle factors', () => {
    const document = dataset.toSeedDocument(
      {
        ...basePokemon,
        candy_count: undefined,
        egg: 'Not in Eggs',
        spawn_time: 'N/A',
        multipliers: null,
      },
      importedAt,
    );

    expect(document.candyCount).toBeUndefined();
    expect(document.eggDistanceKm).toBeNull();
    expect(document.spawnTime).toBeNull();
    expect(document.multipliers).toEqual([]);
    expect(document.evolutionMultiplierAverage).toBeNull();
  });

  it('creates all documents with a shared import timestamp', () => {
    const documents = dataset.createSeedDocuments(
      { pokemon: [basePokemon, { ...basePokemon, id: 2, num: '002' }] },
      importedAt,
    );

    expect(documents).toHaveLength(2);
    expect(documents.every((document) => document.importedAt === importedAt)).toBe(true);
  });

  it('rejects required metric values with unexpected units', () => {
    expect(() => dataset.parseRequiredMetricValue('6.9 lbs', 'kg', 'Pokemon weight')).toThrow(
      'Pokemon weight must be a numeric value followed by "kg".',
    );
  });
});
