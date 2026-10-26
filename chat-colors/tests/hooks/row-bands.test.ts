/**
 * Tests of hooks/row-bands.ts: which message rows get a band and in which colour, and which are drawn as usual.
 */
import type { PromptOrigin } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { ALPHA, COLOR, ENGINE_TREE, bandTree } from '../fixtures/trees'
import {
  FILE,
  bridgeText,
  endTurn,
  mountClaudeText,
  mountPrompt,
  startSession,
  storeClaudeRow,
  textBlock,
} from '../support/chat-session'

/** Origins of user-role rows that are not the person's own prompt. */
const OTHER_ORIGINS: readonly PromptOrigin[] = [
  { kind: 'task-notification' },
  { kind: 'scheduled-trigger' },
  { kind: 'peer' },
  { kind: 'peer-send-message' },
  { kind: 'projects-relay' },
  { kind: 'channel', server: 'slack' },
  { kind: 'coordinator' },
  { kind: 'observer' },
  { kind: 'observer-activity' },
  { kind: 'auto-continuation' },
  { kind: 'unclassified' },
  { kind: 'slack-ping' },
  { kind: 'plugin', name: 'other', asUser: true },
]

// ── Each kind's band ──

test('B1 a prompt of the person gets the prompt band', async ($, on) => {
  await startSession($, on, FILE.colors)

  expect(await (await mountPrompt($, 'vscode', 'Fix the build')).drawn()).toEqual(bandTree(COLOR.prompt, ALPHA.default))
})

test('B2 a text of Claude that nothing classified is a note', async ($, on) => {
  await startSession($, on, FILE.colors)

  expect(await (await mountClaudeText($, 'vscode', 'B2 Let me look.')).drawn()).toEqual(
    bandTree(COLOR.notes, ALPHA.default),
  )
})

test('B3 the answer of an ended turn gets the answer band', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('B3 All 12 tests pass.')])
  await endTurn($)

  expect(await (await mountClaudeText($, 'vscode', 'B3 All 12 tests pass.')).drawn()).toEqual(
    bandTree(COLOR.answer, ALPHA.default),
  )
})

test('B4 a summary block is a note, even with the text of an answer', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('B4 Done.')])
  await endTurn($)

  expect(await (await mountClaudeText($, 'vscode', 'B4 Done.', { isSummary: true })).drawn()).toEqual(
    bandTree(COLOR.notes, ALPHA.default),
  )
})

// ── Whose prompt ──

test('B5 the person typing at the terminal or through Remote Control gets the prompt band too', async ($, on) => {
  await startSession($, on, FILE.colors)

  for (const kind of ['composer', 'bridge'] as const) {
    expect({ kind, tree: await (await mountPrompt($, 'vscode', 'Go on', { kind })).drawn() }).toEqual({
      kind,
      tree: bandTree(COLOR.prompt, ALPHA.default),
    })
  }
})

test('B6 a user row that is not the person own prompt is drawn as usual, reading nothing', async ($, on) => {
  const keysRead: string[] = []

  on('state.get', (_, e, next) => {
    keysRead.push(e.key)

    return next(e)
  })
  await startSession($, on, FILE.colors)
  keysRead.length = 0

  for (const origin of OTHER_ORIGINS) {
    expect({ origin, tree: await (await mountPrompt($, 'vscode', 'Task done', origin)).drawn() }).toEqual({
      origin,
      tree: ENGINE_TREE,
    })
  }
  expect(keysRead).toEqual([])
})

// ── Surfaces, colours, height ──

test('B7 a row on a surface not listed is drawn as usual, reading nothing', async ($, on) => {
  const keysRead: string[] = []

  on('state.get', (_, e, next) => {
    keysRead.push(e.key)

    return next(e)
  })
  await startSession($, on, FILE.colors)
  await (await mountPrompt($, 'vscode', 'Fix it')).drawn()
  expect(keysRead).toContain('colors')
  keysRead.length = 0

  for (const surface of ['terminal', 'desktop', 'mobile'] as const) {
    expect(await (await mountPrompt($, surface, 'Fix it')).drawn()).toEqual(ENGINE_TREE)
    expect(await (await mountClaudeText($, surface, 'B7 Let me look.')).drawn()).toEqual(ENGINE_TREE)
  }
  expect(keysRead).toEqual([])
})

test('B7 the surfaces come from the option', { options: { surfaces: 'vscode, terminal' } }, async ($, on) => {
  await startSession($, on, FILE.colors)

  expect(await (await mountPrompt($, 'terminal', 'Fix it')).drawn()).toEqual(bandTree(COLOR.prompt, ALPHA.default))
  expect(await (await mountPrompt($, 'desktop', 'Fix it')).drawn()).toEqual(ENGINE_TREE)
})

test('B8 a kind whose colour is null is drawn as usual', async ($, on) => {
  await startSession($, on, { value: bridgeText({ prompt: null, notes: null, answer: COLOR.answer }, 15) })

  expect(await (await mountPrompt($, 'vscode', 'Fix it')).drawn()).toEqual(ENGINE_TREE)
  expect(await (await mountClaudeText($, 'vscode', 'B8 Let me look.')).drawn()).toEqual(ENGINE_TREE)
})

test('B8 with no colour for notes or answer, Claude rows do not read their kind', async ($, on) => {
  const keysRead: string[] = []

  on('state.get', (_, e, next) => {
    keysRead.push(e.key)

    return next(e)
  })
  await startSession($, on, { value: bridgeText({ prompt: COLOR.prompt, notes: null, answer: null }, 15) })
  keysRead.length = 0

  expect(await (await mountClaudeText($, 'vscode', 'B8 Let me look.')).drawn()).toEqual(ENGINE_TREE)
  expect(keysRead).toEqual(['colors'])
})

test('B9 the band height comes from the option', { options: { bandRows: 3 } }, async ($, on) => {
  await startSession($, on, FILE.colors)

  expect(await (await mountPrompt($, 'vscode', 'Fix it')).drawn()).toEqual(bandTree(COLOR.prompt, ALPHA.default, 3))
})

// ── Render ids ──

test('B10 the kind follows the text, whatever form the row render id takes', async ($, on) => {
  const ids = ['bmsg_01AbC:1', 'bmsg_01AbC:1#2', 'u3f0c9a1e-2b7d-4c55-9f1e-6a2b8c0d4e11', '3f0c9a1e-2b7d-4c55-9f1e-6a2b8c0d4e11']

  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('B10 The fix is in.')])
  await endTurn($)

  for (const requestId of ids) {
    expect({ requestId, tree: await (await mountClaudeText($, 'vscode', 'B10 The fix is in.', { requestId })).drawn() }).toEqual({
      requestId,
      tree: bandTree(COLOR.answer, ALPHA.default),
    })
  }
})
