/**
 * Small list helpers.
 */

/**
 * Turns a value that may be missing into a list of none or one, for spreading into a list of parts.
 *
 * @param value the value, or null
 * @returns `[value]`, or `[]` for null
 */
export function optional<T>(value: T | null): T[] {
  return value === null ? [] : [value]
}
