/**
 * Tests of hooks/bridge-path.ts: which home folder an empty variable leaves (B1's decision 6, beside rule R10).
 */
import { expect, test } from 'claude-code/testing'

import { BRIDGE_FILE, FILE, HOME, startSession } from '../support/bridge-session'

test('D6 an empty USERPROFILE counts as unset, so HOME is the home folder', async ($, on) => {
  const { file } = await startSession($, on, FILE.show, { USERPROFILE: '', HOME })

  expect(file.reads).toEqual([BRIDGE_FILE])
})
