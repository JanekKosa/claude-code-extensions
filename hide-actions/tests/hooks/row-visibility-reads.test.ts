/**
 * Tests of hooks/row-visibility.ts: rows that can never hide do not read the value, so a toggle of the view button
 * redraws none of them (B1's decision 8, beside rule R8's surfaces).
 */
import { expect, test } from 'claude-code/testing'

import { ENGINE_TREE } from '../fixtures/trees'
import { FILE, drawEverySite, startSession } from '../support/bridge-session'

/** What the three sites (ToolUse, ToolResult, ToolGroup) draw when each is the engine's own drawing. */
const ENGINE_ON_EVERY_SITE = [ENGINE_TREE, ENGINE_TREE, ENGINE_TREE]

test('D8 an expanded row and a row of an always-shown tool are drawn without reading the value', async ($, on) => {
  const keysRead: string[] = []

  on('state.get', (_, e, next) => {
    keysRead.push(e.key)

    return next(e)
  })
  await startSession($, on, FILE.hide)
  keysRead.length = 0
  await drawEverySite($, 'vscode', 'Bash')
  expect(keysRead).toContain('hideActions')
  keysRead.length = 0

  expect(await drawEverySite($, 'vscode', 'Bash', true)).toEqual(ENGINE_ON_EVERY_SITE)
  expect(await drawEverySite($, 'vscode', 'AskUserQuestion')).toEqual(ENGINE_ON_EVERY_SITE)
  expect(keysRead).toEqual([])
})
