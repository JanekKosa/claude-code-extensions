/**
 * Tests of hooks/bridge-path.ts: where the bridge file is read.
 */
import { expect, test } from 'claude-code/testing'

import { BRIDGE_PATH_PARTS } from '../../hooks/bridge-path'
import { ENGINE_TREE } from '../fixtures/trees'
import { BRIDGE_FILE, DEFAULT_POLL_MS, FILE, HOME, mountPrompt, startSession } from '../support/chat-session'

test('H1 the bridge is read under USERPROFILE, before HOME', async ($, on) => {
  const { file } = await startSession($, on, FILE.colors, { env: { USERPROFILE: HOME, HOME: '/home/other' } })

  expect(file.reads).toEqual([BRIDGE_FILE])
})

test('H1 an empty USERPROFILE counts as unset, so HOME is the home folder', async ($, on) => {
  const { file } = await startSession($, on, FILE.colors, { env: { USERPROFILE: '', HOME } })

  expect(file.reads).toEqual([BRIDGE_FILE])
})

test('H1 HOME is the home folder when USERPROFILE is unset', async ($, on) => {
  const { file } = await startSession($, on, FILE.colors, { env: { HOME: '/home/tester' } })

  // The engine resolves the path before the fs hooks see it (on Windows `/home/...` arrives as `C:\home\...`).
  expect(file.reads).toHaveLength(1)
  expect(file.reads[0]).toMatch(/[\\/]home[\\/]tester[\\/]\.claude[\\/]claude-code-extensions[\\/]chat-view\.json$/)
})

test('H2 with no home folder nothing is read and no band is drawn', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.colors, { env: {} })

  await clock.advance(DEFAULT_POLL_MS)
  expect(file.reads).toEqual([])
  expect(await (await mountPrompt($, 'vscode', 'Fix it')).drawn()).toEqual(ENGINE_TREE)
})

test('H3 the path parts live once, in hooks/bridge-path.ts', () => {
  expect(BRIDGE_PATH_PARTS).toEqual(['.claude', 'claude-code-extensions', 'chat-view.json'])
})
