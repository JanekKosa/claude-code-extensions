/**
 * Tests of hooks/bridge-poll.ts and the colours in hooks/chat-state.ts: the colours follow the bridge file, and a
 * change redraws the rows already drawn.
 */
import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { ALPHA, COLOR, ENGINE_TREE, bandTree } from '../fixtures/trees'
import {
  DEFAULT_POLL_MS,
  FILE,
  bridgeText,
  mountClaudeText,
  mountPrompt,
  startSession,
} from '../support/chat-session'

/**
 * Records every write of a state value as it lands, by key. Register it before the session starts.
 *
 * @param on the test's registrar, whose hooks sit beneath the mod
 * @returns the keys written so far, in order
 */
function recordWrites(on: On): string[] {
  const keys: string[] = []

  on('state.set', async (_, e, next) => {
    const result = await next(e)

    keys.push(e.key)

    return result
  })

  return keys
}

// ── Session start ──

test('P1 the session start reads the bridge once and returns the engine answer', async ($, on) => {
  const { file, started } = await startSession($, on, FILE.colors)

  expect(file.reads).toHaveLength(1)
  expect(started).toEqual({ cwd: 'C:\\work' })
})

test('P1 the poll starts with the session', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.colors)

  await clock.advance(DEFAULT_POLL_MS * 3)
  expect(file.reads).toHaveLength(4)
})

// ── The interval ──

test('P2 the poll runs every pollMs, from the option', { options: { pollMs: 1000 } }, async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.missing)
  const row = await mountPrompt($, 'vscode', 'Fix it')

  file.answer = FILE.colors
  await clock.advance(999)
  expect(await row.drawn()).toEqual(ENGINE_TREE)
  await clock.advance(1)
  expect(await row.drawn()).toEqual(bandTree(COLOR.prompt, ALPHA.default))
})

// ── Writing only on a change ──

test('P3 an unchanged file across several polls writes the colours once', async ($, on) => {
  const writes = recordWrites(on)
  const { file, clock } = await startSession($, on, FILE.colors)

  await clock.advance(DEFAULT_POLL_MS * 4)
  expect(file.reads).toHaveLength(5)
  expect(writes.filter(key => key === 'colors')).toHaveLength(1)
})

// ── Redrawing ──

test('P4 a change of the file redraws the rows drawn, both ways, with no other call', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.missing)
  const prompt = await mountPrompt($, 'vscode', 'Fix it')
  const note = await mountClaudeText($, 'vscode', 'P4 Let me look.')

  expect([await prompt.drawn(), await note.drawn()]).toEqual([ENGINE_TREE, ENGINE_TREE])
  file.answer = FILE.colors
  await clock.advance(DEFAULT_POLL_MS)
  expect([await prompt.drawn(), await note.drawn()]).toEqual([
    bandTree(COLOR.prompt, ALPHA.default),
    bandTree(COLOR.notes, ALPHA.default),
  ])
  file.answer = { value: bridgeText({ ...COLOR, prompt: '#000000' }, 100) }
  await clock.advance(DEFAULT_POLL_MS)
  expect([await prompt.drawn(), await note.drawn()]).toEqual([
    bandTree('#000000', ALPHA.solid),
    bandTree(COLOR.notes, ALPHA.solid),
  ])
  file.answer = FILE.missing
  await clock.advance(DEFAULT_POLL_MS)
  expect([await prompt.drawn(), await note.drawn()]).toEqual([ENGINE_TREE, ENGINE_TREE])
})
