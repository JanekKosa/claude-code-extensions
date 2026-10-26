/**
 * Test support: stands in for everything beneath the mod (the home folder, the disk that holds the bridge file, the
 * clock, the transcript a resumed chat holds, the bottom of a turn's end and the engine's own drawing), starts a
 * session, draws message rows, and stores Claude's blocks and ends turns as the engine does.
 */
import type { On, PromptOrigin, RenderSurface, SessionMessage } from 'claude-code'
import { mock } from 'claude-code/testing'
import type { Engine, MockClock } from 'claude-code/testing'

import { COLOR, ENGINE_TREE } from '../fixtures/trees'

/** What the stand-in disk answers for a read of the bridge file: its text, or a refusal with the OS error. */
export type FileAnswer = { readonly value: string } | { readonly deny: string }

/** The bridge file as the test controls it: what the next read answers, and every path read so far. */
export type StandInFile = { answer: FileAnswer; readonly reads: string[] }

/** A started session's stand-ins, and what `$.session.start` resolved to. */
export type Session = { readonly file: StandInFile; readonly clock: MockClock; readonly started: unknown }

/**
 * What a session starts with besides the bridge file: the environment, the transcript of a resumed chat, and a log
 * the stand-ins write `started` (the session's start reached the bottom) and `messages` (the transcript was read) to.
 */
export type SessionSetup = {
  readonly env?: Readonly<Record<string, string>>
  readonly transcript?: readonly SessionMessage[]
  readonly log?: string[]
}

/** A content block of a stored row, as the Messages API spells it. */
type Block = { readonly type: string; readonly [field: string]: unknown }

// ── The stand-in home, file and clock ──

/** The home folder the tests' environment holds. */
export const HOME = 'C:\\Users\\tester'

/** Where the mod reads the bridge under that home. */
export const BRIDGE_FILE = 'C:\\Users\\tester\\.claude\\claude-code-extensions\\chat-view.json'

/** The manifest's default `pollMs`. */
export const DEFAULT_POLL_MS = 500

/**
 * Writes a bridge file's text, as claude-toolbar writes it: compact JSON and one line feed.
 *
 * @param colors the `colors` object
 * @param tintPercent the `tintPercent` field; left out when undefined
 * @returns the text
 */
export function bridgeText(colors: Readonly<Record<string, unknown>>, tintPercent?: unknown): string {
  return `${JSON.stringify({ colors, ...(tintPercent === undefined ? {} : { tintPercent }) })}\n`
}

/** The answers the stand-in disk gives, by what the file holds. */
export const FILE = {
  colors: { value: bridgeText(COLOR, 15) },
  missing: { deny: `ENOENT: no such file or directory, open '${BRIDGE_FILE}'` },
  busy: { deny: `EBUSY: resource busy or locked, open '${BRIDGE_FILE}'` },
  notJson: { value: '{"colors":{"prompt":"#4FA' },
} as const

// ── Starting a session ──

/**
 * Registers the stand-ins and starts a session on vscode. Call it before any other call on `$`, which would load
 * the plugins first.
 *
 * @param $ the test's engine
 * @param on the test's registrar, whose hooks sit beneath the mod
 * @param first what the bridge file answers at the start
 * @param setup the environment (USERPROFILE set to HOME when not given), the transcript (empty when not given), the log
 * @returns the stand-in file, the clock, and what the session's start resolved to
 */
export async function startSession($: Engine, on: On, first: FileAnswer, setup: SessionSetup = {}): Promise<Session> {
  const file: StandInFile = { answer: first, reads: [] }
  const clock = mock.clock(on)

  mock.env(on, setup.env ?? { USERPROFILE: HOME })
  on('fs.read', (_, e) => {
    file.reads.push(e.path)

    return file.answer
  })
  on('session.start', (_, e) => {
    setup.log?.push('started')

    return { cwd: e.cwd }
  })
  on('session.messages', () => {
    setup.log?.push('messages')

    return { value: [...(setup.transcript ?? [])] }
  })
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('ui.render', () => ENGINE_TREE)
  const started = await $.session.start({ cwd: 'C:\\work', surface: 'vscode', isInteractive: true })

  return { file, clock, started }
}

// ── Drawing rows ──

/**
 * Draws a UserMessage row, as Claude's VS Code chat asks for a prompt: `isExpanded` true, the origin `sdk` unless
 * the test names another.
 *
 * @param $ the test's engine
 * @param surface where it is drawn
 * @param text the prompt's text
 * @param origin where the message came from
 * @returns the mounted drawing
 */
export function mountPrompt($: Engine, surface: RenderSurface, text: string, origin: PromptOrigin = { kind: 'sdk' }) {
  return $.ui.mount({
    plugin: 'chat-colors',
    surface,
    component: 'UserMessage',
    props: { text, origin, isExpanded: true },
  })
}

/**
 * Draws an AssistantMessage row: one block of Claude's text.
 *
 * @param $ the test's engine
 * @param surface where it is drawn
 * @param text the block's text
 * @param row the row's render id, and whether the block is a summary; a fresh id and no summary when not given
 * @returns the mounted drawing
 */
export function mountClaudeText(
  $: Engine,
  surface: RenderSurface,
  text: string,
  row: { readonly requestId?: string; readonly isSummary?: true } = {},
) {
  return $.ui.mount({
    plugin: 'chat-colors',
    surface,
    component: 'AssistantMessage',
    props: { text, isFirstOfReply: true, ...(row.isSummary === undefined ? {} : { isSummary: row.isSummary }) },
    ...(row.requestId === undefined ? {} : { requestId: row.requestId }),
  })
}

// ── Storing Claude's blocks and ending turns ──

/** How many rows the support has stored so far in this file, for a fresh uuid each. */
let storedRows = 0

/**
 * Stores one row of Claude's response, as the query loop does: `session.append` through the door `response`.
 *
 * @param $ the test's engine
 * @param blocks the row's content blocks
 * @param agentId the subagent whose loop made the row; the main conversation when undefined
 * @returns once stored
 */
export async function storeClaudeRow($: Engine, blocks: readonly Block[], agentId?: string): Promise<void> {
  storedRows += 1
  await $.session.append({
    message: { type: 'assistant', role: 'assistant', content: [...blocks] },
    door: 'response',
    origin: { kind: 'model', model: 'claude-test' },
    uuid: `row-${storedRows}`,
    ...(agentId === undefined ? {} : { agentId }),
  })
}

/**
 * A text block.
 *
 * @param text its text
 * @returns the block
 */
export function textBlock(text: string): Block {
  return { type: 'text', text }
}

/**
 * A tool call's block.
 *
 * @param tool the tool's name
 * @returns the block
 */
export function toolCallBlock(tool: string): Block {
  return { type: 'tool_use', id: `toolu_${tool}`, name: tool, input: {} }
}

/**
 * Ends a turn, as the query loop does: `turn.complete` with the reason `answer`.
 *
 * @param $ the test's engine
 * @param agentId the subagent whose turn ends; the main conversation's when undefined
 * @returns once the turn's end has run through the hooks
 */
export async function endTurn($: Engine, agentId?: string): Promise<void> {
  await $.turn.complete({
    answer: '',
    durationMs: 1000,
    isAborted: false,
    turnId: 'turn-1',
    reason: 'answer',
    ...(agentId === undefined ? {} : { agentId }),
  })
}

// ── Transcript rows for a resumed chat ──

/**
 * A prompt row of a transcript.
 *
 * @param text the prompt
 * @returns the row
 */
export function promptRow(text: string): SessionMessage {
  return { role: 'user', text, toolUses: [] }
}

/**
 * A text row of Claude's in a transcript.
 *
 * @param text the text
 * @returns the row
 */
export function claudeTextRow(text: string): SessionMessage {
  return { role: 'assistant', text, toolUses: [] }
}

/**
 * A tool-call row of Claude's in a transcript, with its result stored.
 *
 * @param tool the tool's name
 * @returns the row
 */
export function toolCallRow(tool: string): SessionMessage {
  return { role: 'assistant', text: '', toolUses: [{ tool_use_id: `toolu_${tool}`, tool, input: {}, text: 'ok' }] }
}

/**
 * The user row that carries a tool's result in a transcript.
 *
 * @param tool the tool's name
 * @returns the row
 */
export function toolResultRow(tool: string): SessionMessage {
  return { role: 'user', text: '', toolUses: [], toolResults: [{ tool_use_id: `toolu_${tool}`, text: 'ok', isError: false }] }
}
