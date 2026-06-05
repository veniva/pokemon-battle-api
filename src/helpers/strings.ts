import { TransformFnParams } from "class-transformer";

/** Trims optional string DTO values to be used before validation. */
export function trimStringValue(params: TransformFnParams): unknown {
  const value = params.value as unknown;

  return typeof value === 'string' ? value.trim() : value;
}