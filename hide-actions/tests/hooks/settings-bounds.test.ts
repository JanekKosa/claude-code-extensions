/**
 * Tests of the bounds .claude-plugin/plugin.json gives the options that hooks/settings.ts reads: the engine refuses
 * a value out of bounds before the hooks module loads (B1's decision 3: `pollMs` at least 100).
 */
import { expect, test } from 'claude-code/testing'

import { FILE, startSession } from '../support/bridge-session'

test('D3 a poll interval under 100 ms is refused when the mod loads', { options: { pollMs: 99 } }, async ($, on) => {
  const outcome = await startSession($, on, FILE.show).then(
    () => 'the mod loaded',
    (error: unknown) => String(error),
  )

  expect(outcome).toContain('must be at least 100')
})
