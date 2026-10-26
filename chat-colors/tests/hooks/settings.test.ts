/**
 * Tests of hooks/settings.ts, and of the bounds .claude-plugin/plugin.json gives the options: the engine refuses a
 * value out of bounds before the hooks module loads.
 */
import { expect, test } from 'claude-code/testing'

import { settingsFrom } from '../../hooks/settings'
import { FILE, startSession } from '../support/chat-session'

/**
 * Starts a session and says whether the mod loaded.
 *
 * @param start starts the session
 * @returns `'the mod loaded'`, or the refusal's text
 */
async function loadOutcome(start: () => Promise<unknown>): Promise<string> {
  return start().then(
    () => 'the mod loaded',
    (error: unknown) => String(error),
  )
}

test('S1 settingsFrom reads the numbers and splits the list', () => {
  expect(settingsFrom({ pollMs: 750, surfaces: 'vscode, desktop', bandRows: 2 })).toEqual({
    pollMs: 750,
    surfaces: ['vscode', 'desktop'],
    bandRows: 2,
  })
})

test('S2 a poll interval under 100 ms is refused when the mod loads', { options: { pollMs: 99 } }, async ($, on) => {
  expect(await loadOutcome(() => startSession($, on, FILE.colors))).toContain('must be at least 100')
})

test('S2 a band under 1 row is refused when the mod loads', { options: { bandRows: 0 } }, async ($, on) => {
  expect(await loadOutcome(() => startSession($, on, FILE.colors))).toContain('must be at least 1')
})
