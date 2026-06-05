import { Transform, type TransformFnParams } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { trimStringValue } from '../../helpers/strings';

export const MAX_BATTLE_TEAM_SIZE = 6;

const NON_BLANK_TEXT = /\S/;

/** Describes one Pokemon team submitted for battle simulation. */
export class BattleTeamDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(NON_BLANK_TEXT) // field is optional, but if provided, it cannot be blank
  @Transform(trimStringValue)
  name?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATTLE_TEAM_SIZE)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @Matches(NON_BLANK_TEXT, { each: true, message: 'Each pokemon identifier must not be blank.' })
  @Transform(normalizePokemonIdentifiers)
  pokemon!: string[];
}

/** Normalizes accepted Pokemon identifiers while leaving invalid values for validation errors. */
function normalizePokemonIdentifiers(params: TransformFnParams): unknown {
  const value = params.value as unknown;

  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item: unknown) => {
    if (typeof item === 'number') {
      return String(item);
    }

    return typeof item === 'string' ? item.trim() : item;
  });
}
