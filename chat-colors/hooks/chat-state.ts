/**
 * The mod's `$.state` values, declared in types/index.d.ts: the bands' colours, the kind of each text of Claude's,
 * and the running turn's texts that no tool call has followed yet. Every access to them is in this file, because
 * the engine takes a state reference only from a const of the file that uses it.
 */
import { read, update } from 'claude-code'
import type { StateDollar } from 'claude-code'

import type { CardColors, TextKind } from '../types'
import { NO_BANDS } from './bridge-reading'

/** The references. `plugin` and `key` are literals, as `$.state` requires; a member of `kinds` adds its `id`. */
const COLORS = { plugin: 'chat-colors', key: 'colors' } as const
const KINDS = { plugin: 'chat-colors', key: 'kinds' } as const
const PENDING = { plugin: 'chat-colors', key: 'pending' } as const

/** What a text that nothing has classified reads as: a note, as the running turn's newest text is drawn. */
const UNCLASSIFIED: TextKind = 'note'

// ── The colours (the bridge poll writes, the render hooks read) ──

/**
 * Reads the colours while drawing. The read subscribes the drawing, so a later write draws it again.
 *
 * @param $ the engine interface (its state)
 * @returns the colours held; no bands before the first write
 */
export async function readColors($: StateDollar): Promise<CardColors> {
  return (await read($, COLORS)) ?? NO_BANDS
}

/**
 * Writes the colours only when they differ from the ones held, so an unchanged bridge redraws nothing.
 *
 * @param $ the engine interface (its state)
 * @param colors what the bridge says now
 * @returns once written, or at once when nothing changed
 */
export async function writeColors($: StateDollar, colors: CardColors): Promise<void> {
  const held = await $.state.get(COLORS)

  if (!isSameColors(held.value ?? NO_BANDS, colors)) {
    await $.state.set(COLORS, colors, { ifVersion: held.version })
  }
}

/**
 * Compares two sets of colours field by field.
 *
 * @param a one set
 * @param b the other
 * @returns true when every colour and the tint are equal
 */
function isSameColors(a: CardColors, b: CardColors): boolean {
  return a.prompt === b.prompt && a.notes === b.notes && a.answer === b.answer && a.tintPercent === b.tintPercent
}

// ── The kinds of Claude's texts (the turn and history hooks write, the render hook reads) ──

/**
 * Reads the kind of a text while drawing. The read subscribes the drawing to that text's member alone.
 *
 * @param $ the engine interface (its state)
 * @param key the text's hash
 * @returns the kind held; a note for a text never classified
 */
export async function readTextKind($: StateDollar, key: string): Promise<TextKind> {
  return (await read($, { ...KINDS, id: key })) ?? UNCLASSIFIED
}

/**
 * Writes the kind of a text only when it differs from the one held, so only a row whose kind changes redraws.
 *
 * @param $ the engine interface (its state)
 * @param key the text's hash
 * @param kind what the text is now
 * @returns once written, or at once when nothing changed
 */
export async function writeTextKind($: StateDollar, key: string, kind: TextKind): Promise<void> {
  const held = await $.state.get({ ...KINDS, id: key })

  if ((held.value ?? UNCLASSIFIED) !== kind) {
    await $.state.set({ ...KINDS, id: key }, kind, { ifVersion: held.version })
  }
}

// ── The running turn's texts that no tool call has followed yet ──

/**
 * Adds a text to the running turn's pending texts.
 *
 * @param $ the engine interface (its state)
 * @param key the text's hash
 * @returns once written
 */
export async function addPending($: StateDollar, key: string): Promise<void> {
  await update($, PENDING, keys => [...(keys ?? []), key])
}

/**
 * Empties the pending texts and hands back what they were; writes nothing when there were none.
 *
 * @param $ the engine interface (its state)
 * @returns the hashes that were pending, oldest first
 */
export async function takePending($: StateDollar): Promise<string[]> {
  let taken: string[] = []

  if (((await $.state.get(PENDING)).value ?? []).length > 0) {
    await update($, PENDING, keys => {
      taken = keys ?? []

      return []
    })
  }

  return taken
}
