/**
 * Test support: stands in for everything beneath the mod (the home folder, the disk that holds the bridge file, the
 * clock and the engine's own drawing), starts a session, and draws tool rows on the three sites.
 */
import type { On, RenderSurface } from 'claude-code'
import { mock } from 'claude-code/testing'
import type { Engine, MockClock } from 'claude-code/testing'

import { ENGINE_TREE } from '../fixtures/trees'

/** What the stand-in disk answers for a read of the bridge file: its text, or a refusal with the OS error. */
export type FileAnswer = { readonly value: string } | { readonly deny: string }

/** The bridge file as the test controls it: what the next read answers, and every path read so far. */
export type StandInFile = { answer: FileAnswer; readonly reads: string[] }

/** A started session's stand-ins, and what `$.session.start` resolved to. */
export type Session = { readonly file: StandInFile; readonly clock: MockClock; readonly started: unknown }

// ── The stand-in home, file and clock ──

/** The home folder the tests' environment holds. */
export const HOME = 'C:\\Users\\tester'

/** Where the mod reads the bridge under that home. */
export const BRIDGE_FILE = 'C:\\Users\\tester\\.claude\\claude-code-extensions\\chat-view.json'

/** The manifest's default `pollMs`. */
export const DEFAULT_POLL_MS = 500

/** The answers the stand-in disk gives, by what the file holds. */
export const FILE = {
  hide: { value: '{"hideActions":true}' },
  show: { value: '{"hideActions":false}' },
  missing: { deny: `ENOENT: no such file or directory, open '${BRIDGE_FILE}'` },
  busy: { deny: `EBUSY: resource busy or locked, open '${BRIDGE_FILE}'` },
  notJson: { value: '{"hideActions":tr' },
} as const

// ── Starting a session ──

/**
 * Registers the stand-ins and starts a session on vscode. Call it before any other call on `$`, which would load
 * the plugins first.
 *
 * @param $ the test's engine
 * @param on the test's registrar, whose hooks sit beneath the mod
 * @param first what the bridge file answers at the start
 * @param env the environment variables the mod sees
 * @returns the stand-in file, the clock, and what the session's start resolved to
 */
export async function startSession(
  $: Engine,
  on: On,
  first: FileAnswer,
  env: Readonly<Record<string, string>> = { USERPROFILE: HOME },
): Promise<Session> {
  const file: StandInFile = { answer: first, reads: [] }
  const clock = mock.clock(on)

  mock.env(on, env)
  on('fs.read', (_, e) => {
    file.reads.push(e.path)

    return file.answer
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('ui.render', () => ENGINE_TREE)
  const started = await $.session.start({ cwd: 'C:\\work', surface: 'vscode', isInteractive: true })

  return { file, clock, started }
}

// ── Drawing rows ──

/**
 * A finished call of `tool`, as a tool row's props carry it.
 *
 * @param tool the tool's name
 * @returns the call's props
 */
function callOf(tool: string) {
  return { tool_use_id: 'toolu_1', tool, input: {}, isRunning: false, isErrored: false, isInterrupted: false }
}

/**
 * The `isExpanded` prop, left out when the test gives none, as on a surface that does not say.
 *
 * @param isExpanded whether the row is drawn in full, or undefined
 * @returns the prop to spread into a row's props
 */
function expandedProp(isExpanded: boolean | undefined) {
  return isExpanded === undefined ? {} : { isExpanded }
}

/**
 * Draws a ToolUse row.
 *
 * @param $ the test's engine
 * @param surface where it is drawn
 * @param tool the tool the row names
 * @param isExpanded whether it is drawn in full; left out when undefined
 * @returns the mounted drawing
 */
export function mountToolUse($: Engine, surface: RenderSurface, tool: string, isExpanded?: boolean) {
  return $.ui.mount({
    plugin: 'hide-actions',
    surface,
    component: 'ToolUse',
    props: { ...callOf(tool), ...expandedProp(isExpanded) },
  })
}

/**
 * Draws a ToolResult row.
 *
 * @param $ the test's engine
 * @param surface where it is drawn
 * @param tool the tool the result belongs to
 * @param isExpanded whether it is drawn in full; left out when undefined
 * @returns the mounted drawing
 */
export function mountToolResult($: Engine, surface: RenderSurface, tool: string, isExpanded?: boolean) {
  return $.ui.mount({
    plugin: 'hide-actions',
    surface,
    component: 'ToolResult',
    props: { tool_use_id: 'toolu_1', tool, output: { stdout: 'ok' }, isErrored: false, ...expandedProp(isExpanded) },
  })
}

/**
 * Draws a ToolGroup row, one call per tool.
 *
 * @param $ the test's engine
 * @param surface where it is drawn
 * @param tools the tools of the group's calls, in order
 * @param isExpanded whether each call draws as its own row
 * @returns the mounted drawing
 */
export function mountToolGroup($: Engine, surface: RenderSurface, tools: readonly string[], isExpanded = false) {
  return $.ui.mount({
    plugin: 'hide-actions',
    surface,
    component: 'ToolGroup',
    props: { calls: tools.map(callOf), isActive: false, isExpanded },
  })
}

/**
 * Draws one row on each tool-row site, the group holding the one call.
 *
 * @param $ the test's engine
 * @param surface where they are drawn
 * @param tool the tool the rows name
 * @param isExpanded whether they are drawn in full; left out of ToolUse and ToolResult when undefined
 * @returns the trees drawn for ToolUse, ToolResult and ToolGroup, in that order
 */
export async function drawEverySite($: Engine, surface: RenderSurface, tool: string, isExpanded?: boolean) {
  const drawings = [
    await mountToolUse($, surface, tool, isExpanded),
    await mountToolResult($, surface, tool, isExpanded),
    await mountToolGroup($, surface, [tool], isExpanded ?? false),
  ]

  return Promise.all(drawings.map(drawing => drawing.drawn()))
}
