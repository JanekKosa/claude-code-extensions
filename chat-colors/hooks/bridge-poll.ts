/**
 * Keeping the colours in step with the bridge file: one read when the session starts, then one every `pollMs`.
 * The timer is the colours' only writer; the render hooks only read them.
 */
import type { EngineInterface } from 'claude-code'

import { bridgePath } from './bridge-path'
import { readBridge } from './bridge-reading'
import { writeColors } from './chat-state'

/** What the poll uses of the engine interface. */
type PollDollar = Pick<EngineInterface, 'clock' | 'env' | 'fs' | 'state'>

// ── Polling ──

/**
 * Brings the colours in step with the bridge now, then every `pollMs`. With no home folder there is no file to
 * follow, and nothing starts. The session's start calls it; a reload of the module calls it again, with fresh
 * timers.
 *
 * @param $ the engine interface
 * @param pollMs the interval, in milliseconds
 * @returns once the first read is in and the timer runs
 */
export async function startPolling($: PollDollar, pollMs: number): Promise<void> {
  const path = await bridgePath($)

  if (path === undefined) {
    return
  }

  await syncFromBridge($, path)
  $.clock.every(pollMs, () => void syncFromBridge($, path))
}

/**
 * Reads the bridge once and brings the colours held to what it says; a reading that says "keep" changes nothing.
 *
 * @param $ the engine interface
 * @param path the bridge file's path
 * @returns once the colours are in step
 */
async function syncFromBridge($: PollDollar, path: string): Promise<void> {
  const reading = await readBridge($, path)

  if (reading !== 'keep') {
    await writeColors($, reading)
  }
}
