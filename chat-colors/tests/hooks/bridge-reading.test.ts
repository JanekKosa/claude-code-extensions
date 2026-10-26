/**
 * Tests of hooks/bridge-reading.ts: what each kind of bridge file (version 2) means for the bands.
 */
import { expect, test } from 'claude-code/testing'

import { ALPHA, COLOR, ENGINE_TREE, bandTree } from '../fixtures/trees'
import { DEFAULT_POLL_MS, FILE, bridgeText, mountPrompt, startSession } from '../support/chat-session'

// ── Valid ──

test('R1 a valid file colours each kind with its own colour and tint', async ($, on) => {
  await startSession($, on, { value: bridgeText({ prompt: '#123456', notes: null, answer: null }, 40) })

  expect(await (await mountPrompt($, 'vscode', 'Fix it')).drawn()).toEqual(bandTree('#123456', '66'))
})

test('R1 hex digits of either case are a colour', async ($, on) => {
  await startSession($, on, { value: bridgeText({ prompt: '#a1B2c3' }, 15) })

  expect(await (await mountPrompt($, 'vscode', 'Fix it')).drawn()).toEqual(bandTree('#a1B2c3', ALPHA.default))
})

// ── A colour that is not #RRGGBB ──

test('R2 null, a short, a long, a named or a non-string colour reads as no band', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.colors)
  const row = await mountPrompt($, 'vscode', 'Fix it')

  for (const prompt of [null, '#4FA', '#4FA3E0FF', 'red', 'rgb(1, 2, 3)', '4FA3E0', '#4FA3EG', 4, true, {}]) {
    file.answer = FILE.colors
    await clock.advance(DEFAULT_POLL_MS)
    expect({ prompt, tree: await row.drawn() }).toEqual({ prompt, tree: bandTree(COLOR.prompt, ALPHA.default) })
    file.answer = { value: bridgeText({ ...COLOR, prompt }, 15) }
    await clock.advance(DEFAULT_POLL_MS)
    expect({ prompt, tree: await row.drawn() }).toEqual({ prompt, tree: ENGINE_TREE })
  }
})

test('R2 a file of valid JSON with no colours object draws no band', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.colors)
  const row = await mountPrompt($, 'vscode', 'Fix it')

  for (const text of ['{}', '{"colors":null}', '{"colors":["#4FA3E0"]}', '{"hideActions":true}', '[]', 'null', '7']) {
    file.answer = FILE.colors
    await clock.advance(DEFAULT_POLL_MS)
    file.answer = { value: text }
    await clock.advance(DEFAULT_POLL_MS)
    expect({ text, tree: await row.drawn() }).toEqual({ text, tree: ENGINE_TREE })
  }
})

// ── The tint ──

test('R3 a tint out of range, not an integer or missing reads as 15', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.colors)
  const row = await mountPrompt($, 'vscode', 'Fix it')

  for (const tint of [-1, 101, 15.5, '50', null, undefined]) {
    file.answer = { value: bridgeText(COLOR, 100) }
    await clock.advance(DEFAULT_POLL_MS)
    expect({ tint, tree: await row.drawn() }).toEqual({ tint, tree: bandTree(COLOR.prompt, ALPHA.solid) })
    file.answer = { value: bridgeText(COLOR, tint) }
    await clock.advance(DEFAULT_POLL_MS)
    expect({ tint, tree: await row.drawn() }).toEqual({ tint, tree: bandTree(COLOR.prompt, ALPHA.default) })
  }
})

test('R3 the tint ends 0 and 100 are kept', async ($, on) => {
  const { file, clock } = await startSession($, on, { value: bridgeText(COLOR, 0) })
  const row = await mountPrompt($, 'vscode', 'Fix it')

  expect(await row.drawn()).toEqual(bandTree(COLOR.prompt, ALPHA.clear))
  file.answer = { value: bridgeText(COLOR, 100) }
  await clock.advance(DEFAULT_POLL_MS)
  expect(await row.drawn()).toEqual(bandTree(COLOR.prompt, ALPHA.solid))
})

// ── Missing, unreadable, broken ──

test('R4 a missing file draws no band', async ($, on) => {
  await startSession($, on, FILE.missing)

  expect(await (await mountPrompt($, 'vscode', 'Fix it')).drawn()).toEqual(ENGINE_TREE)
})

test('R4 a file deleted after naming colours draws no band at the next poll', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.colors)
  const row = await mountPrompt($, 'vscode', 'Fix it')

  file.answer = FILE.missing
  await clock.advance(DEFAULT_POLL_MS)
  expect(await row.drawn()).toEqual(ENGINE_TREE)
})

test('R5 an unreadable file keeps the colours held', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.colors)
  const row = await mountPrompt($, 'vscode', 'Fix it')

  file.answer = FILE.busy
  await clock.advance(DEFAULT_POLL_MS * 2)
  expect(await row.drawn()).toEqual(bandTree(COLOR.prompt, ALPHA.default))
})

test('R5 broken JSON keeps the colours held', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.colors)
  const row = await mountPrompt($, 'vscode', 'Fix it')

  file.answer = FILE.notJson
  await clock.advance(DEFAULT_POLL_MS * 2)
  expect(await row.drawn()).toEqual(bandTree(COLOR.prompt, ALPHA.default))
})
