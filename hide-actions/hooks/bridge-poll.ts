/**
 * Keeping `hideActions` in step with the bridge file: one read when the session starts, then one every `pollMs`.
 * The timer is the value's only writer; the render hooks only read it.
 */
import type { EngineInterface, On } from 'claude-code'

import { bridgePath } from './bridge-path'
import { readBridge } from './bridge-reading'
import { writeHideActions } from './hide-state'
import type { Settings } from './settings'

/** What the poll uses of the engine interface. */
type PollDollar = Pick<EngineInterface, 'clock' | 'env' | 'fs' | 'state'>

// ── Registering ──

/**
 * Registers the session.start hook that reads the bridge once and starts the poll. A reload of the module runs it
 * again, with fresh timers.
 *
 * @param on the module's registrar
 * @param settings the mod's options (pollMs)
 * @returns nothing
 */
export function registerBridgePoll(on: On, settings: Settings): void {
  on('session.start', async ($, e, next) => {
    await startPolling($, settings.pollMs)

    return next(e)
  })
}

// ── Polling ──

/**
 * Brings the value in step with the bridge now, then every `pollMs`. With no home folder there is no file to
 * follow, and nothing starts.
 *
 * @param $ the engine interface
 * @param pollMs the interval, in milliseconds
 * @returns once the first read is in and the timer runs
 */
async function startPolling($: PollDollar, pollMs: number): Promise<void> {
  const path = await bridgePath($)

  if (path === undefined) {
    return
  }

  await syncFromBridge($, path)
  $.clock.every(pollMs, () => void syncFromBridge($, path))
}

/**
 * Reads the bridge once and brings the held value to what it says; a reading that says "keep" changes nothing.
 *
 * @param $ the engine interface
 * @param path the bridge file's path
 * @returns once the value is in step
 */
async function syncFromBridge($: PollDollar, path: string): Promise<void> {
  const reading = await readBridge($, path)

  if (reading !== 'keep') {
    await writeHideActions($, reading)
  }
}
