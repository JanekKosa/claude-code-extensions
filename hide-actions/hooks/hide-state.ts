/**
 * The mod's one `$.state` value, declared in types/index.d.ts: whether tool rows are hidden now. Every access to it
 * is in this file, because the engine takes a state reference only from a const of the file that uses it.
 */
import { read } from 'claude-code'
import type { StateDollar } from 'claude-code'

/** The reference to the value. `plugin` and `key` are literals, as `$.state` requires. */
const HIDE_ACTIONS = { plugin: 'hide-actions', key: 'hideActions' } as const

// ── Reading (the render hooks) ──

/**
 * Reads the value while drawing. The read subscribes the drawing, so a later write draws it again.
 *
 * @param $ the engine interface (its state)
 * @returns true while rows are hidden; false before the first write
 */
export async function readHideActions($: StateDollar): Promise<boolean> {
  return (await read($, HIDE_ACTIONS)) === true
}

// ── Writing (the bridge poll) ──

/**
 * Writes the value only when it differs from the one held (a value never written counts as false), so an unchanged
 * bridge leaves the value and its version alone.
 *
 * @param $ the engine interface (its state)
 * @param hideActions what the bridge says now
 * @returns once written, or at once when nothing changed
 */
export async function writeHideActions($: StateDollar, hideActions: boolean): Promise<void> {
  const held = await $.state.get(HIDE_ACTIONS)

  if ((held.value ?? false) !== hideActions) {
    await $.state.set(HIDE_ACTIONS, hideActions, { ifVersion: held.version })
  }
}
