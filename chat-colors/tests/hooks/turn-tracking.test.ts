/**
 * Tests of hooks/turn-tracking.ts and the kinds in hooks/chat-state.ts: notes and the answer of the running turn,
 * as its rows are stored and as it ends.
 */
import { expect, test } from 'claude-code/testing'

import { ALPHA, COLOR, bandTree } from '../fixtures/trees'
import {
  FILE,
  endTurn,
  mountClaudeText,
  startSession,
  storeClaudeRow,
  textBlock,
  toolCallBlock,
} from '../support/chat-session'

const NOTE = bandTree(COLOR.notes, ALPHA.default)
const ANSWER = bandTree(COLOR.answer, ALPHA.default)

/**
 * Draws a text of Claude's on vscode and answers its tree.
 *
 * @param $ the test's engine
 * @param text the block's text
 * @returns the tree drawn
 */
async function drawnText($: Parameters<typeof mountClaudeText>[0], text: string) {
  return (await mountClaudeText($, 'vscode', text)).drawn()
}

// ── A turn with tool calls, and one without ──

test('L1 in a turn with tool calls, a text a tool call follows is a note and the last text is the answer', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('L1 Let me read the config.')])
  await storeClaudeRow($, [toolCallBlock('Read')])
  await storeClaudeRow($, [textBlock('L1 Now the tests.')])
  await storeClaudeRow($, [toolCallBlock('Bash')])
  await storeClaudeRow($, [textBlock('L1 The build passes.')])
  await endTurn($)

  expect(await drawnText($, 'L1 Let me read the config.')).toEqual(NOTE)
  expect(await drawnText($, 'L1 Now the tests.')).toEqual(NOTE)
  expect(await drawnText($, 'L1 The build passes.')).toEqual(ANSWER)
})

test('L2 in a turn without tool calls, the text is the answer', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('L2 Yes, that is right.')])
  await endTurn($)

  expect(await drawnText($, 'L2 Yes, that is right.')).toEqual(ANSWER)
})

// ── A running turn ──

test('L3 a running turn newest text is a note, and turns into the answer when the turn ends', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('L3 Here is the fix.')])
  const row = await mountClaudeText($, 'vscode', 'L3 Here is the fix.')

  expect(await row.drawn()).toEqual(NOTE)
  await endTurn($)
  expect(await row.drawn()).toEqual(ANSWER)
})

test('L4 a running turn newest text that a further tool call follows stays a note when the turn ends', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('L4 Checking once more.')])
  const row = await mountClaudeText($, 'vscode', 'L4 Checking once more.')

  await storeClaudeRow($, [toolCallBlock('Grep')])
  await endTurn($)
  expect(await row.drawn()).toEqual(NOTE)
})

test('L5 a text and a tool call in one row: the text is a note', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('L5 Running it.'), toolCallBlock('Bash')])
  await endTurn($)

  expect(await drawnText($, 'L5 Running it.')).toEqual(NOTE)
})

test('L6 two texts after the last tool call are both the answer', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [toolCallBlock('Read')])
  await storeClaudeRow($, [textBlock('L6 Found it.')])
  await storeClaudeRow($, [textBlock('L6 The cause is the cache.')])
  await endTurn($)

  expect(await drawnText($, 'L6 Found it.')).toEqual(ANSWER)
  expect(await drawnText($, 'L6 The cause is the cache.')).toEqual(ANSWER)
})

test('L7 an interrupted turn ends too: its last text is the answer', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('L7 Half way there.')])
  await $.turn.complete({ answer: '', durationMs: 10, isAborted: true, turnId: 'turn-7', reason: 'aborted' })

  expect(await drawnText($, 'L7 Half way there.')).toEqual(ANSWER)
})

// ── Only the main conversation ──

test('L8 a subagent rows and turn ends are passed by', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('L8 Main says.')])
  await storeClaudeRow($, [textBlock('L8 Sub says.')], 'agent-1')
  await storeClaudeRow($, [toolCallBlock('Read')], 'agent-1')
  await endTurn($, 'agent-1')

  expect(await drawnText($, 'L8 Main says.')).toEqual(NOTE)
  await endTurn($)
  expect(await drawnText($, 'L8 Main says.')).toEqual(ANSWER)
  expect(await drawnText($, 'L8 Sub says.')).toEqual(NOTE)
})

test('L9 blank texts and rows of other blocks change nothing', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('L9 The answer.')])
  await storeClaudeRow($, [{ type: 'thinking', thinking: 'hm', signature: 's' }])
  await storeClaudeRow($, [textBlock('   ')])
  await endTurn($)

  expect(await drawnText($, 'L9 The answer.')).toEqual(ANSWER)
})

// ── The limits of keying by text ──

test('L10 two identical texts share one kind: the newest wins, and a text drawn earlier follows it', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('L10 Done.')])
  await endTurn($)
  const first = await mountClaudeText($, 'vscode', 'L10 Done.')

  expect(await first.drawn()).toEqual(ANSWER)
  await storeClaudeRow($, [textBlock('L10 Done.')])
  expect(await first.drawn()).toEqual(NOTE)
  await storeClaudeRow($, [toolCallBlock('Bash')])
  await endTurn($)
  expect(await first.drawn()).toEqual(NOTE)
})

test('L11 surrounding white space does not change the key', async ($, on) => {
  await startSession($, on, FILE.colors)
  await storeClaudeRow($, [textBlock('\nL11 All good.\n')])
  await endTurn($)

  expect(await drawnText($, 'L11 All good.')).toEqual(ANSWER)
})
