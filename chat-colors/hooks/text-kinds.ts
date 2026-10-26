/**
 * Telling notes from answers in a transcript read whole: a text of Claude's is a note when a tool call follows it
 * before its turn ends, and part of the answer when none does. A turn ends where the next prompt starts one, and at
 * the transcript's end.
 */
import type { SessionMessage } from 'claude-code'

import type { TextKind } from '../types'
import { hashText } from '../utils/hash'

/** The walk through a transcript: the kinds found so far by text hash, and the turn's texts no tool call followed. */
type Walk = { readonly kinds: Map<string, TextKind>; pending: string[] }

// ── Classifying ──

/**
 * Classifies every text of Claude's in a transcript. Two rows with the same text share one entry, the later one's
 * kind winning.
 *
 * @param rows the transcript, oldest first, as `$.session.messages()` gives it (one row per stored block)
 * @returns each text's kind, keyed by the hash of the text trimmed
 */
export function kindsOfTranscript(rows: readonly SessionMessage[]): Map<string, TextKind> {
  const walk: Walk = { kinds: new Map(), pending: [] }

  for (const row of rows) {
    followRow(walk, row)
  }
  endTurn(walk)

  return walk.kinds
}

// ── Walking ──

/**
 * Takes one row into the walk: a prompt ends the turn before it; Claude's row adds its text and its tool calls.
 *
 * @param walk the walk so far
 * @param row the next row
 * @returns nothing; the walk is updated
 */
function followRow(walk: Walk, row: SessionMessage): void {
  if (isTurnStart(row)) {
    endTurn(walk)
  } else if (row.role === 'assistant') {
    followClaudesRow(walk, row)
  }
}

/**
 * Takes one of Claude's rows into the walk: its text is a note for now; a tool call in it keeps every text before
 * it a note.
 *
 * @param walk the walk so far
 * @param row a row of Claude's
 * @returns nothing; the walk is updated
 */
function followClaudesRow(walk: Walk, row: SessionMessage): void {
  const text = row.text.trim()

  if (text !== '') {
    const key = hashText(text)

    walk.kinds.set(key, 'note')
    walk.pending.push(key)
  }
  if (row.toolUses.length > 0) {
    walk.pending = []
  }
}

/**
 * Ends the turn: the texts no tool call followed are its answer.
 *
 * @param walk the walk so far
 * @returns nothing; the walk is updated
 */
function endTurn(walk: Walk): void {
  for (const key of walk.pending) {
    walk.kinds.set(key, 'answer')
  }
  walk.pending = []
}

/**
 * Tells whether a row starts a turn: a user row that carries no tool result (a prompt, or a message from someone
 * else that the session answers).
 *
 * @param row a row of the transcript
 * @returns true for a user row without tool results
 */
function isTurnStart(row: SessionMessage): boolean {
  return row.role === 'user' && (row.toolResults ?? []).length === 0
}
