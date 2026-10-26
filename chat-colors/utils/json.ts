/**
 * Generic helpers: parsing JSON text without throwing, and telling what the parsed value is.
 */

/** What `parseJson` answers: the value, or that the text was not valid JSON. */
export type JsonParse = { readonly isJson: true; readonly value: unknown } | { readonly isJson: false }

// ── Parsing ──

/**
 * Parses JSON text.
 *
 * @param text the text to parse
 * @returns `{ isJson: true, value }`, or `{ isJson: false }` when the text is not valid JSON
 */
export function parseJson(text: string): JsonParse {
  try {
    return { isJson: true, value: JSON.parse(text) }
  } catch {
    return { isJson: false }
  }
}

// ── Inspecting ──

/**
 * Tells whether a parsed value is a JSON object: not an array, not null, not a scalar.
 *
 * @param value the parsed value
 * @returns true for an object, which can then be read by key
 */
export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
