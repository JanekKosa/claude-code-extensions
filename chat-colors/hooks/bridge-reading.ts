/**
 * Reading the bridge file once, and what its content (version 2 of the contract with claude-toolbar) means for the
 * bands: `{"colors":{"prompt":"#4FA3E0","notes":"#D29922","answer":"#3FB950"},"tintPercent":15}`.
 */
import type { EngineInterface } from 'claude-code'

import type { CardColors } from '../types'
import { namesErrno } from '../utils/errors'
import { isHexColor } from '../utils/hex-color'
import { isJsonObject, parseJson } from '../utils/json'

/** What one read of the bridge says: the colours to draw with, or keep the colours held (`'keep'`). */
export type BridgeReading = CardColors | 'keep'

/**
 * The OS error a read of a missing file rejects with. It reaches a hooks module only inside the rejection's
 * message (`chat-colors: $.fs.read: ENOENT: no such file or directory, ...`), not as Node's `code` field.
 */
const NOT_FOUND = 'ENOENT'

// ── The contract's defaults (protocol constants, shared with claude-toolbar's bridge writer) ──

/** The tint, in percent, that a missing or invalid `tintPercent` reads as. */
export const DEFAULT_TINT_PERCENT = 15

/** The range a `tintPercent` must lie in, both ends included. */
const TINT_RANGE = { min: 0, max: 100 } as const

/** No bands at all: what a missing file means, and what the mod holds before the first read. */
export const NO_BANDS: CardColors = { prompt: null, notes: null, answer: null, tintPercent: DEFAULT_TINT_PERCENT }

// ── Reading ──

/**
 * Reads the bridge file once, with one `$.fs.read`, which opens and closes the file at once; the file is never
 * held, so the toolbar's rename over it is never blocked.
 *
 * @param $ the engine interface (its file system)
 * @param path the bridge file's path
 * @returns no bands when the file is missing; `'keep'` when it cannot be read now (another refusal, such as EBUSY
 *   while the toolbar renames over it); else what its content says
 */
export async function readBridge($: Pick<EngineInterface, 'fs'>, path: string): Promise<BridgeReading> {
  return $.fs.read(path).then(colorsIn, (err: unknown) => (namesErrno(err, NOT_FOUND) ? NO_BANDS : 'keep'))
}

// ── Interpreting ──

/**
 * Says what the bridge file's text means for the bands.
 *
 * @param text the file's text
 * @returns `'keep'` when it is not valid JSON (a write may be under way); else the colours it names, a colour that
 *   is not `#RRGGBB` reading as null and a tint that is not an integer from 0 to 100 reading as 15
 */
function colorsIn(text: string): BridgeReading {
  const parsed = parseJson(text)

  if (!parsed.isJson) {
    return 'keep'
  }
  const file = isJsonObject(parsed.value) ? parsed.value : {}
  const colors = isJsonObject(file.colors) ? file.colors : {}

  return {
    prompt: colorOrNull(colors.prompt),
    notes: colorOrNull(colors.notes),
    answer: colorOrNull(colors.answer),
    tintPercent: tintOf(file.tintPercent),
  }
}

/**
 * Reads one colour field.
 *
 * @param value the field's value
 * @returns the colour when it is `#RRGGBB`, else null
 */
function colorOrNull(value: unknown): string | null {
  return isHexColor(value) ? value : null
}

/**
 * Reads the tint field.
 *
 * @param value the field's value
 * @returns the value when it is an integer from 0 to 100, else the default tint
 */
function tintOf(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= TINT_RANGE.min && value <= TINT_RANGE.max
    ? value
    : DEFAULT_TINT_PERCENT
}
