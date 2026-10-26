/**
 * JSON objects changed one key at a time, without touching the rest. Knows nothing of the toolbar.
 */

/** A JSON object, such as an object-valued setting holds. */
export interface JsonObject {
  readonly [key: string]: unknown;
}

/**
 * Tells whether a value is a JSON object: not null, not an array.
 * @param value the value, of any type
 * @returns true for an object
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Copies an object with one key set, or removed. Every other key keeps its value (the same value, not a copy of it)
 * and its place; a key that is new goes at the end.
 * @param object the object, left as it is
 * @param key the key
 * @param value its new value, or undefined to remove it
 * @returns the copy
 */
export function withKey(object: JsonObject, key: string, value: unknown): JsonObject {
  if (value !== undefined && Object.hasOwn(object, key)) return { ...object, [key]: value };
  const others = Object.fromEntries(Object.entries(object).filter(([name]) => name !== key));
  return value === undefined ? others : { ...others, [key]: value };
}
