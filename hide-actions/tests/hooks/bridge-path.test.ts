/**
 * Tests of hooks/bridge-path.ts: where the bridge file is read (rule R10).
 */
import { expect, test } from 'claude-code/testing'

import { BRIDGE_PATH_PARTS } from '../../hooks/bridge-path'
import { ENGINE_TREE } from '../fixtures/trees'
import { BRIDGE_FILE, DEFAULT_POLL_MS, FILE, HOME, mountToolUse, startSession } from '../support/bridge-session'

test('R10 the bridge is read under USERPROFILE, before HOME', async ($, on) => {
  const { file } = await startSession($, on, FILE.show, { USERPROFILE: HOME, HOME: '/home/other' })

  expect(file.reads).toEqual([BRIDGE_FILE])
})

test('R10 HOME is the home folder when USERPROFILE is unset', async ($, on) => {
  const { file } = await startSession($, on, FILE.show, { HOME: '/home/tester' })

  // The engine resolves the path before the fs hooks see it (on Windows `/home/...` arrives as `C:\home\...`).
  expect(file.reads).toHaveLength(1)
  expect(file.reads[0]).toMatch(/[\\/]home[\\/]tester[\\/]\.claude[\\/]claude-code-extensions[\\/]chat-view\.json$/)
})

test('R10 with no home folder nothing is read and rows show', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.hide, {})

  await clock.advance(DEFAULT_POLL_MS)
  expect(file.reads).toEqual([])
  expect(await (await mountToolUse($, 'vscode', 'Bash')).drawn()).toEqual(ENGINE_TREE)
})

test('R10 the path parts live once, in hooks/bridge-path.ts', () => {
  expect(BRIDGE_PATH_PARTS).toEqual(['.claude', 'claude-code-extensions', 'chat-view.json'])
})
