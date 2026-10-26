/**
 * Generic helpers: telling a colour written `#RRGGBB`, and giving such a colour an opacity as `#RRGGBBAA`.
 */

/** A colour written `#` and six hex digits, in either case. */
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

/** The largest value of one colour channel, and of the alpha byte. */
const BYTE_MAX = 255

/** The opacity, in percent, of a solid colour. */
const SOLID_PERCENT = 100

// ── Reading ──

/**
 * Tells whether a value is a colour written `#RRGGBB`.
 *
 * @param value any value, such as a field of parsed JSON
 * @returns true for a string of `#` and six hex digits
 */
export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value)
}

// ── Writing ──

/**
 * Gives a `#RRGGBB` colour an opacity, written as the eight-digit `#RRGGBBAA` form.
 *
 * @param color the colour, `#RRGGBB`
 * @param percent the opacity, from 0 (clear) to 100 (solid)
 * @returns the colour with its alpha byte appended, such as `#4FA3E026` for 15
 */
export function withOpacity(color: string, percent: number): string {
  const alpha = Math.round((percent * BYTE_MAX) / SOLID_PERCENT)

  return `${color}${alpha.toString(16).padStart(2, '0').toUpperCase()}`
}
