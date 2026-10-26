/**
 * Tests of hooks/row-visibility.ts: the tree each tool-row site draws (rules R1 to R9).
 */
import { expect, test } from 'claude-code/testing'

import { ENGINE_TREE, HIDDEN_TREE } from '../fixtures/trees'
import {
  FILE,
  drawEverySite,
  mountToolGroup,
  mountToolResult,
  mountToolUse,
  startSession,
} from '../support/bridge-session'

const ENGINE_ON_EVERY_SITE = [ENGINE_TREE, ENGINE_TREE, ENGINE_TREE]

// ── Hidden while the value is true ──

test('R1 a ToolUse row on a listed surface is drawn empty while the value is true', async ($, on) => {
  await startSession($, on, FILE.hide)

  expect(await (await mountToolUse($, 'vscode', 'Bash')).drawn()).toEqual(HIDDEN_TREE)
})

test('R2 a ToolResult row on a listed surface is drawn empty while the value is true', async ($, on) => {
  await startSession($, on, FILE.hide)

  expect(await (await mountToolResult($, 'vscode', 'Bash')).drawn()).toEqual(HIDDEN_TREE)
})

test('R3 a ToolGroup row on a listed surface is drawn empty while the value is true', async ($, on) => {
  await startSession($, on, FILE.hide)

  expect(await (await mountToolGroup($, 'vscode', ['Read', 'Grep'])).drawn()).toEqual(HIDDEN_TREE)
})

// ── Drawn as usual ──

test('R4 while the value is false every site is the engine drawing', async ($, on) => {
  await startSession($, on, FILE.show)

  expect(await drawEverySite($, 'vscode', 'Bash')).toEqual(ENGINE_ON_EVERY_SITE)
})

test('R5 an expanded row is drawn while hidden, on every site', async ($, on) => {
  await startSession($, on, FILE.hide)

  expect(await drawEverySite($, 'vscode', 'Bash', true)).toEqual(ENGINE_ON_EVERY_SITE)
})

test('R6 a row of an always-shown tool is drawn while hidden, on every site', async ($, on) => {
  await startSession($, on, FILE.hide)

  expect(await drawEverySite($, 'vscode', 'AskUserQuestion')).toEqual(ENGINE_ON_EVERY_SITE)
  expect(await drawEverySite($, 'vscode', 'ExitPlanMode')).toEqual(ENGINE_ON_EVERY_SITE)
})

test('R6 a group with one always-shown call among others is drawn while hidden', async ($, on) => {
  await startSession($, on, FILE.hide)

  expect(await (await mountToolGroup($, 'vscode', ['Read', 'AskUserQuestion', 'Grep'])).drawn()).toEqual(ENGINE_TREE)
})

test('R7 the always-shown tools come from the option', { options: { alwaysShow: 'Bash, TodoWrite' } }, async ($, on) => {
  await startSession($, on, FILE.hide)

  expect(await drawEverySite($, 'vscode', 'Bash')).toEqual(ENGINE_ON_EVERY_SITE)
  expect(await drawEverySite($, 'vscode', 'TodoWrite')).toEqual(ENGINE_ON_EVERY_SITE)
  expect(await (await mountToolUse($, 'vscode', 'AskUserQuestion')).drawn()).toEqual(HIDDEN_TREE)
})

// ── Surfaces ──

test('R8 a row on a surface not listed is drawn without reading the value', async ($, on) => {
  const keysRead: string[] = []

  on('state.get', ($, e, next) => {
    keysRead.push(e.key)

    return next(e)
  })
  await startSession($, on, FILE.hide)
  keysRead.length = 0
  await drawEverySite($, 'vscode', 'Bash')
  expect(keysRead).toContain('hideActions')
  keysRead.length = 0

  expect(await drawEverySite($, 'desktop', 'Bash')).toEqual(ENGINE_ON_EVERY_SITE)
  expect(await drawEverySite($, 'terminal', 'Bash')).toEqual(ENGINE_ON_EVERY_SITE)
  expect(keysRead).toEqual([])
})

test('R8 the surfaces come from the option', { options: { surfaces: 'vscode, desktop' } }, async ($, on) => {
  await startSession($, on, FILE.hide)

  expect(await drawEverySite($, 'desktop', 'Bash')).toEqual([HIDDEN_TREE, HIDDEN_TREE, HIDDEN_TREE])
  expect(await drawEverySite($, 'terminal', 'Bash')).toEqual(ENGINE_ON_EVERY_SITE)
})

// ── The hidden tree ──

test('R9 the hidden tree is exactly an empty Box: no child, no border, no background', async ($, on) => {
  await startSession($, on, FILE.hide)

  expect(await (await mountToolUse($, 'vscode', 'Bash')).drawn()).toStrictEqual(HIDDEN_TREE)
})
