/**
 * Hex colors in one form: `#RRGGBB`, upper case. Knows nothing of the toolbar.
 */

/** A color written as # and six hex digits, in either case. */
const sixDigitHex = /^#[0-9a-f]{6}$/i;

/**
 * Brings a value that should be a hex color into the one form.
 * @param value the value, of any type
 * @returns `#RRGGBB` in upper case when the value is # and six hex digits in either case, else null
 */
export function normalizedHexColor(value: unknown): string | null {
  return typeof value === 'string' && sixDigitHex.test(value) ? value.toUpperCase() : null;
}

/**
 * Reads a color as a person types it: spaces around it are ignored and the # may be left out.
 * @param text what was typed
 * @returns `#RRGGBB` in upper case, or null when it is not six hex digits
 */
export function typedHexColor(text: string): string | null {
  const trimmed = text.trim();
  return normalizedHexColor(trimmed.startsWith('#') ? trimmed : `#${trimmed}`);
}
