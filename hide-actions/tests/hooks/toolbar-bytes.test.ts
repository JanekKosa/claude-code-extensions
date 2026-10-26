/**
 * Tests that the bridge file's exact texts as the Claude toolbar writes them (tests/fixtures/toolbar-bytes.ts,
 * generated from the toolbar's own writer) bring the value to what the toolbar meant: each text, read by a poll after
 * a start that said the opposite.
 */
import { expect, test } from 'claude-code/testing'

import { TOOLBAR_TEXTS } from '../fixtures/toolbar-bytes'
import type { ToolbarText } from '../fixtures/toolbar-bytes'
import { ENGINE_TREE, HIDDEN_TREE } from '../fixtures/trees'
import { DEFAULT_POLL_MS, mountToolUse, startSession } from '../support/bridge-session'

// ── The texts and what they mean ──

/**
 * The tree a ToolUse row on vscode is drawn as for a value of `hideActions`.
 *
 * @param hideActions the value
 * @returns the hidden tree while true, the engine's drawing while false
 */
function rowTreeFor(hideActions: boolean) {
  return hideActions ? HIDDEN_TREE : ENGINE_TREE
}

/**
 * A text the toolbar wrote that means the opposite of the given one, for the session's start.
 *
 * @param sample one of the toolbar's texts
 * @returns the first of the toolbar's texts whose `hideActions` differs
 */
function oppositeOf(sample: ToolbarText): ToolbarText {
  const opposite = TOOLBAR_TEXTS.find(other => other.hideActions !== sample.hideActions)

  if (opposite === undefined) {
    throw new Error(`The fixture holds no text meaning hideActions ${!sample.hideActions}.`)
  }

  return opposite
}

// ── Each text ──

for (const sample of TOOLBAR_TEXTS) {
  test(`the toolbar's text after its "${sample.write}" write brings the value to ${sample.hideActions}`, async ($, on) => {
    const { file, clock } = await startSession($, on, { value: oppositeOf(sample).text })
    const row = await mountToolUse($, 'vscode', 'Bash')

    expect(await row.drawn()).toEqual(rowTreeFor(!sample.hideActions))
    file.answer = { value: sample.text }
    await clock.advance(DEFAULT_POLL_MS)
    expect(await row.drawn()).toEqual(rowTreeFor(sample.hideActions))
  })
}
