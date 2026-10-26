/**
 * Following the running turn as its rows are stored: a text of Claude's is a note while the turn runs; a tool call
 * after it keeps it a note; the end of the turn makes the texts that no tool call followed the answer. Only the
 * main conversation counts: a subagent's rows and turns are passed by.
 */
import type { On, StateDollar } from 'claude-code'

import type { ContentBlock } from '../utils/api-blocks'
import { isToolCallBlock, trimmedTextOf } from '../utils/api-blocks'
import { hashText } from '../utils/hash'
import { addPending, takePending, writeTextKind } from './chat-state'

// ── Registering ──

/**
 * Registers the hooks that follow the main conversation's turns: each block of Claude's response as it is
 * stored, and each turn's end.
 *
 * @param on the module's registrar
 * @returns nothing
 */
export function registerTurnTracking(on: On): void {
  on('session.append', { door: 'response' }, async ($, e, next) => {
    const stored = await next(e)

    if (e.agentId === undefined && e.message.type === 'assistant') {
      await followBlocks($, e.message.content)
    }

    return stored
  })
  on('turn.complete', async ($, e, next) => {
    const completed = await next(e)

    if (e.agentId === undefined) {
      await endTurn($)
    }

    return completed
  })
}

// ── Following ──

/**
 * Takes a stored row's blocks in order: a text starts a note, a tool call keeps every text before it a note.
 *
 * @param $ the engine interface (its state)
 * @param blocks the row's content blocks
 * @returns once the kinds are written
 */
async function followBlocks($: StateDollar, blocks: readonly ContentBlock[]): Promise<void> {
  for (const block of blocks) {
    const text = trimmedTextOf(block)

    if (isToolCallBlock(block)) {
      await takePending($)
    } else if (text !== undefined) {
      await startNote($, hashText(text))
    }
  }
}

/**
 * Marks a new text of the running turn a note, and pending until a tool call follows it or the turn ends.
 *
 * @param $ the engine interface (its state)
 * @param key the text's hash
 * @returns once written
 */
async function startNote($: StateDollar, key: string): Promise<void> {
  await writeTextKind($, key, 'note')
  await addPending($, key)
}

/**
 * Ends the turn: its pending texts, which no tool call followed, are the answer.
 *
 * @param $ the engine interface (its state)
 * @returns once written
 */
async function endTurn($: StateDollar): Promise<void> {
  for (const key of await takePending($)) {
    await writeTextKind($, key, 'answer')
  }
}
