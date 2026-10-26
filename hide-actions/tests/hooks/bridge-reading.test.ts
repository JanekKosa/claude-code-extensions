/**
 * Tests of hooks/bridge-reading.ts: what each kind of bridge file means for the rows (rules R12, R13, R14).
 */
import { expect, test } from 'claude-code/testing'

import { ENGINE_TREE, HIDDEN_TREE } from '../fixtures/trees'
import { DEFAULT_POLL_MS, FILE, mountToolUse, startSession } from '../support/bridge-session'

// ── Missing ──

test('R12 a missing file shows the rows', async ($, on) => {
  await startSession($, on, FILE.missing)

  expect(await (await mountToolUse($, 'vscode', 'Bash')).drawn()).toEqual(ENGINE_TREE)
})

test('R12 a file deleted after saying true shows the rows again at the next poll', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.hide)
  const row = await mountToolUse($, 'vscode', 'Bash')

  expect(await row.drawn()).toEqual(HIDDEN_TREE)
  file.answer = FILE.missing
  await clock.advance(DEFAULT_POLL_MS)
  expect(await row.drawn()).toEqual(ENGINE_TREE)
})

// ── Unreadable, or not JSON ──

test('R13 an unreadable file keeps the value as it was', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.hide)
  const row = await mountToolUse($, 'vscode', 'Bash')

  file.answer = FILE.busy
  await clock.advance(DEFAULT_POLL_MS * 2)
  expect(await row.drawn()).toEqual(HIDDEN_TREE)
})

test('R13 a file that is not valid JSON keeps the value as it was', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.hide)
  const row = await mountToolUse($, 'vscode', 'Bash')

  file.answer = FILE.notJson
  await clock.advance(DEFAULT_POLL_MS * 2)
  expect(await row.drawn()).toEqual(HIDDEN_TREE)
})

// ── Valid JSON ──

test('R14 valid JSON whose hideActions is not true shows the rows', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.hide)
  const row = await mountToolUse($, 'vscode', 'Bash')
  const texts = ['{"hideActions":false}', '{}', '{"hideActions":"true"}', '{"hideActions":1}', '[true]', 'true', 'null']

  for (const text of texts) {
    file.answer = FILE.hide
    await clock.advance(DEFAULT_POLL_MS)
    expect({ text, tree: await row.drawn() }).toEqual({ text, tree: HIDDEN_TREE })
    file.answer = { value: text }
    await clock.advance(DEFAULT_POLL_MS)
    expect({ text, tree: await row.drawn() }).toEqual({ text, tree: ENGINE_TREE })
  }
})
