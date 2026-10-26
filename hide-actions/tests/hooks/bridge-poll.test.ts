/**
 * Tests of hooks/bridge-poll.ts and hooks/hide-state.ts: the value follows the bridge file (rules R11, R15, R16,
 * R17).
 */
import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { ENGINE_TREE, HIDDEN_TREE } from '../fixtures/trees'
import { DEFAULT_POLL_MS, FILE, mountToolUse, startSession } from '../support/bridge-session'

/** One write of a state value that landed: the value, and the version it brought the value to. */
type Write = { readonly key: string; readonly value: unknown; readonly version: number | undefined }

// ── Watching the value (the test's `$` has no `state` noun; versions carry on from earlier tests in a file) ──

/**
 * Records every write of a state value as it lands. Register it before the session starts.
 *
 * @param on the test's registrar, whose hooks sit beneath the mod
 * @returns the writes so far, in order
 */
function recordWrites(on: On): Write[] {
  const writes: Write[] = []

  on('state.set', async (_, e, next) => {
    const result = await next(e)

    writes.push({ key: e.key, value: e.value, version: result.value?.version })

    return result
  })

  return writes
}

/**
 * Records the version each read of a state value answers. Register it before the session starts.
 *
 * @param on the test's registrar, whose hooks sit beneath the mod
 * @returns the versions read so far, in order
 */
function recordReadVersions(on: On): Array<number | undefined> {
  const versions: Array<number | undefined> = []

  on('state.get', async (_, e, next) => {
    const result = await next(e)

    versions.push(result.value?.version)

    return result
  })

  return versions
}

// ── Session start ──

test('R11 session.start reads the bridge once, sets the value and returns the engine answer', async ($, on) => {
  const writes = recordWrites(on)
  const { file, started } = await startSession($, on, FILE.hide)

  expect(file.reads).toHaveLength(1)
  expect(writes.map(({ key, value }) => ({ key, value }))).toEqual([{ key: 'hideActions', value: true }])
  expect(started).toEqual({ cwd: 'C:\\work' })
})

test('R11 a file saying true at the start hides the first row drawn', async ($, on) => {
  await startSession($, on, FILE.hide)

  expect(await (await mountToolUse($, 'vscode', 'Bash')).drawn()).toEqual(HIDDEN_TREE)
})

test('R11 the poll starts with the session', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.show)

  await clock.advance(DEFAULT_POLL_MS * 3)
  expect(file.reads).toHaveLength(4)
})

// ── The interval ──

test('R15 the poll runs every pollMs, from the option', { options: { pollMs: 1000 } }, async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.show)
  const row = await mountToolUse($, 'vscode', 'Bash')

  file.answer = FILE.hide
  await clock.advance(999)
  expect(await row.drawn()).toEqual(ENGINE_TREE)
  await clock.advance(1)
  expect(await row.drawn()).toEqual(HIDDEN_TREE)
})

// ── Writing only on a change ──

test('R16 an unchanged file across several polls leaves the version as it was', async ($, on) => {
  const writes = recordWrites(on)
  const versionsRead = recordReadVersions(on)
  const { file, clock } = await startSession($, on, FILE.hide)
  const startVersion = writes[0]?.version

  versionsRead.length = 0
  await clock.advance(DEFAULT_POLL_MS * 4)
  expect(file.reads).toHaveLength(5)
  expect(writes).toHaveLength(1)
  expect(versionsRead).toEqual([startVersion, startVersion, startVersion, startVersion])
})

test('R16 a file saying false from the start writes nothing', async ($, on) => {
  const writes = recordWrites(on)
  const { file, clock } = await startSession($, on, FILE.show)

  await clock.advance(DEFAULT_POLL_MS * 2)
  expect(file.reads).toHaveLength(3)
  expect(writes).toEqual([])
})

// ── Redrawing ──

test('R17 a change redraws a drawn row both ways, with no other call', async ($, on) => {
  const { file, clock } = await startSession($, on, FILE.show)
  const row = await mountToolUse($, 'vscode', 'Bash')

  expect(await row.drawn()).toEqual(ENGINE_TREE)
  file.answer = FILE.hide
  await clock.advance(DEFAULT_POLL_MS)
  expect(await row.drawn()).toEqual(HIDDEN_TREE)
  file.answer = FILE.show
  await clock.advance(DEFAULT_POLL_MS)
  expect(await row.drawn()).toEqual(ENGINE_TREE)
})
