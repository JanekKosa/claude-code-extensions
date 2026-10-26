/**
 * Tests of hooks/history.ts and hooks/session-start.ts: the rows of a resumed chat are classified when the session
 * starts.
 */
import { expect, test } from 'claude-code/testing'

import { ALPHA, COLOR, bandTree } from '../fixtures/trees'
import {
  FILE,
  claudeTextRow,
  endTurn,
  mountClaudeText,
  promptRow,
  startSession,
  storeClaudeRow,
  textBlock,
  toolCallRow,
  toolResultRow,
} from '../support/chat-session'

const NOTE = bandTree(COLOR.notes, ALPHA.default)
const ANSWER = bandTree(COLOR.answer, ALPHA.default)

/** A resumed chat of two turns: one with a tool call, one without. */
const TRANSCRIPT = [
  promptRow('Fix the build'),
  claudeTextRow('Y Let me read the log.'),
  toolCallRow('Read'),
  toolResultRow('Read'),
  claudeTextRow('Y The build is fixed.'),
  promptRow('Thanks'),
  claudeTextRow('Y You are welcome.'),
]

test('Y1 the rows of a resumed chat are notes and answers from the start', async ($, on) => {
  await startSession($, on, FILE.colors, { transcript: TRANSCRIPT })

  expect(await (await mountClaudeText($, 'vscode', 'Y Let me read the log.')).drawn()).toEqual(NOTE)
  expect(await (await mountClaudeText($, 'vscode', 'Y The build is fixed.')).drawn()).toEqual(ANSWER)
  expect(await (await mountClaudeText($, 'vscode', 'Y You are welcome.')).drawn()).toEqual(ANSWER)
})

test('Y2 a new turn after the resume leaves the earlier answers alone', async ($, on) => {
  await startSession($, on, FILE.colors, { transcript: TRANSCRIPT })
  await storeClaudeRow($, [textBlock('Y2 Anything else?')])
  await endTurn($)

  expect(await (await mountClaudeText($, 'vscode', 'Y The build is fixed.')).drawn()).toEqual(ANSWER)
  expect(await (await mountClaudeText($, 'vscode', 'Y2 Anything else?')).drawn()).toEqual(ANSWER)
})

test('Y3 the session start reads the transcript once it has started', async ($, on) => {
  const log: string[] = []

  await startSession($, on, FILE.colors, { log })

  expect(log).toEqual(['started', 'messages'])
})
