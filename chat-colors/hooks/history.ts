/**
 * Classifying the rows a resumed chat already holds when the session starts, from `$.session.messages()`: those
 * rows were never appended in this session, so the turn tracking never saw them.
 */
import type { EngineInterface } from 'claude-code'

import { writeTextKind } from './chat-state'
import { kindsOfTranscript } from './text-kinds'

/** What the classification uses of the engine interface. */
type HistoryDollar = Pick<EngineInterface, 'session' | 'state'>

// ── Classifying ──

/**
 * Reads the transcript and writes the kind of each text of Claude's in it. The session's start calls it, once the
 * session has started.
 *
 * @param $ the engine interface (the session's messages, the state)
 * @returns once every kind is written
 */
export async function classifyHistory($: HistoryDollar): Promise<void> {
  for (const [key, kind] of kindsOfTranscript(await $.session.messages())) {
    await writeTextKind($, key, kind)
  }
}
