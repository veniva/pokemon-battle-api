import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const POKEMON_COLLECTION = 'pokemon';

export type PokemonDocument = HydratedDocument<Pokemon>;

/** Represents a lightweight link to a Pokemon evolution. */
@Schema({ _id: false })
export class EvolutionLink {
  @Prop({ required: true })
  num!: string;

  @Prop({ required: true })
  name!: string;
}

export const EvolutionLinkSchema = SchemaFactory.createForClass(EvolutionLink);

/** Stores Pokemon data in a normalized form suitable for battle simulation queries. */
@Schema({ collection: POKEMON_COLLECTION, timestamps: true, versionKey: false })
export class Pokemon {
  @Prop({ required: true })
  pokemonId!: number;

  @Prop({ required: true })
  dexNumber!: string;

  @Prop({ required: true })
  name!: string;

  /** case-insensitive version of `name` for exact lookups. */
  @Prop({ required: true })
  normalizedName!: string;

  @Prop({ required: true })
  imageUrl!: string;

  @Prop({ type: [String], required: true })
  types!: string[];

  @Prop({ required: true })
  heightMeters!: number;

  @Prop({ required: true })
  weightKg!: number;

  @Prop({ required: true })
  candy!: string;

  @Prop()
  candyCount?: number;

  @Prop({ required: true })
  egg!: string;

  @Prop({ type: Number, default: null })
  eggDistanceKm!: number | null;

  @Prop({ required: true })
  spawnChance!: number;

  @Prop({ required: true })
  averageSpawns!: number;

  @Prop({ type: String, default: null })
  spawnTime!: string | null;

  @Prop({ type: [Number], default: [] })
  multipliers!: number[];

  @Prop({ type: Number, default: null })
  evolutionMultiplierAverage!: number | null;

  @Prop({ type: [String], required: true })
  weaknesses!: string[];

  @Prop({ type: [EvolutionLinkSchema], default: [] })
  previousEvolutions!: EvolutionLink[];

  @Prop({ type: [EvolutionLinkSchema], default: [] })
  nextEvolutions!: EvolutionLink[];

  @Prop({ required: true })
  importedAt!: Date;
}

export const PokemonSchema = SchemaFactory.createForClass(Pokemon);

PokemonSchema.index({ pokemonId: 1 }, { unique: true });
PokemonSchema.index({ dexNumber: 1 }, { unique: true });
PokemonSchema.index({ normalizedName: 1 });
PokemonSchema.index({ types: 1 });
