/**
 * Test support: stands in for everything beneath the mod (the clock, the command list, the panes, the spawns, the
 * turns' ends), starts a session, raises agent starts, steps and turn ends as the engine does, and reads the pane
 * back as lines of text.
 */
import type { AgentSpawnInput, On, RenderSurface, TurnCompleteReason } from 'claude-code'
import { mock } from 'claude-code/testing'
import type { Engine, MockClock } from 'claude-code/testing'

/** A started session's stand-ins: the clock, the panes the engine holds open, and every open and close asked. */
export type Session = {
  readonly clock: MockClock
  readonly openPanes: Set<string>
  readonly log: string[]
}

/** What a test says about one spawn; the rest is filled in as the engine fills it. */
export type SpawnSpec = {
  readonly id: string
  readonly description?: string
  readonly subagentType?: string
  readonly parentAgentId?: string
  readonly workflow?: { readonly callId: string; readonly runId: string; readonly agentIndex: number }
  readonly isTeammate?: true
  readonly resume?: true
}

/** The time the tests' clock starts at. */
export const START = 1_000_000

/** The model every stand-in spawn resolves to. */
export const MODEL = 'claude-haiku-5-5'

/** What every stand-in model request answers it used: 47,600 tokens of context in all. */
const STEP_USAGE = {
  model: MODEL,
  input_tokens: 600,
  cache_read_input_tokens: 40_000,
  cache_creation_input_tokens: 6_000,
  output_tokens: 1_000,
}

/** The pane's id and the props the engine draws it with. */
const PANE_ID = 'agents-pane'
const PANE_PROPS = {
  title: 'Agents',
  isFocused: false,
  bodyColumns: 80,
  placement: 'inline',
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
} as const

// ── Starting a session ──

/**
 * Starts a session with every stand-in in place. A spawn's id comes from the prompt the test gives it.
 *
 * @param $ the test's engine
 * @param on the test's registrar, beneath the mod
 * @returns the stand-ins
 */
export async function startSession($: Engine, on: On): Promise<Session> {
  const clock = mock.clock(on, { now: START })
  const openPanes = new Set<string>()
  const log: string[] = []

  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('command.register', () => ({ value: { command: 'agents-pane' } }))
  on('ui.open', (_, e) => {
    openPanes.add(e.id)
    log.push(`open ${e.id}`)

    return { value: { isPlaced: true } }
  })
  on('ui.close', (_, e) => {
    openPanes.delete(e.id)
    log.push(`close ${e.id} by ${e.origin.kind}`)

    return { value: undefined }
  })
  on('ui.panes', () => ({
    value: [...openPanes].map(id => ({ id, title: 'Agents', isShown: true, isFocused: false, isPlaced: true })),
  }))
  on('agent.spawn', (_, e) => ({ model: MODEL, agentId: e.resume?.agentId ?? e.prompt }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('turn.step', async function* (_, e) {
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'end_turn' as const, usage: STEP_USAGE }
  })
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('session.end', (_, e) => ({ sessionId: e.sessionId }))
  await $.session.start({ cwd: 'C:\\work', surface: 'vscode', isInteractive: true })

  return { clock, openPanes, log }
}

// ── Raising what the engine raises ──

/**
 * Starts an agent as the Agent tool or a workflow script does. The stand-in beneath answers the prompt as its id.
 *
 * @param $ the test's engine
 * @param spec the spawn
 * @returns once the mod has heard it
 */
export async function spawn($: Engine, spec: SpawnSpec): Promise<void> {
  const e: AgentSpawnInput = {
    tool_use_id: spec.workflow?.callId ?? `toolu_${spec.id}`,
    prompt: spec.id,
    description: spec.description ?? '',
    subagentType: spec.subagentType ?? 'general-purpose',
    provider: { plugin: 'engine', tier: 'core' },
    parentModel: 'claude-opus-5-5',
    background: true,
    fork: false,
    ...(spec.parentAgentId === undefined ? {} : { parentAgentId: spec.parentAgentId }),
    ...(spec.isTeammate === undefined ? {} : { isTeammate: true }),
    ...(spec.resume === undefined ? {} : { resume: { agentId: spec.id } }),
    ...(spec.workflow === undefined
      ? {}
      : { workflow: { runId: spec.workflow.runId, agentIndex: spec.workflow.agentIndex } }),
  }

  await $.agent.spawn(e)
}

/**
 * Starts one of an agent's turns.
 *
 * @param $ the test's engine
 * @param agentId the agent
 * @returns once the mod has heard it
 */
export async function startTurn($: Engine, agentId: string): Promise<void> {
  await $.turn.start({ text: '', turnId: `turn-${agentId}`, agentId })
}

/**
 * Ends one of an agent's turns.
 *
 * @param $ the test's engine
 * @param agentId the agent
 * @param reason why it ended
 * @returns once the mod has heard it
 */
export async function endTurn($: Engine, agentId: string, reason: Exclude<TurnCompleteReason, 'refusal'> = 'answer') {
  await $.turn.complete({
    answer: 'report',
    durationMs: 1000,
    isAborted: reason === 'aborted',
    turnId: `turn-${agentId}`,
    reason,
    agentId,
  })
}

/**
 * Sends one of an agent's model requests and reads its response to the end.
 *
 * @param $ the test's engine
 * @param agentId the agent; undefined for the main conversation
 * @param effort the request's effort
 * @returns once the mod has heard the response
 */
export async function step($: Engine, agentId: string | undefined, effort: 'low' | 'high' | 'xhigh' = 'high') {
  const stream = $.turn.step({
    turnId: `turn-${agentId}`,
    index: 0,
    model: MODEL,
    effort,
    messageCount: 1,
    ...(agentId === undefined ? {} : { agentId }),
  })

  for await (const _chunk of stream) {
    // read to the end
  }

  await stream.result
}

/**
 * Stores a response row of tool calls, from an agent or from the main conversation.
 *
 * @param $ the test's engine
 * @param calls each call's tool, id and input
 * @param agentId the agent; undefined for the main conversation
 * @returns once the mod has heard it
 */
export async function storeCalls(
  $: Engine,
  calls: readonly { readonly name: string; readonly id?: string; readonly input?: Record<string, unknown> }[],
  agentId?: string,
): Promise<void> {
  await $.session.append({
    message: {
      type: 'assistant',
      role: 'assistant',
      content: calls.map(call => ({
        type: 'tool_use',
        id: call.id ?? `toolu_${call.name}`,
        name: call.name,
        input: call.input ?? {},
      })),
    },
    door: 'response',
    origin: { kind: 'model', model: 'claude-test' },
    uuid: `row-${Math.random()}`,
    ...(agentId === undefined ? {} : { agentId }),
  })
}

// ── Reading the pane ──

/**
 * Draws the pane on a surface.
 *
 * @param $ the test's engine
 * @param surface where it is drawn
 * @returns the drawing
 */
export function mountPane($: Engine, surface: RenderSurface) {
  return $.ui.mount({ plugin: 'agents-pane', surface, component: 'Pane', requestId: PANE_ID, props: PANE_PROPS })
}

/** A drawn element as the tests read it. */
type Drawn = {
  type?: string
  props?: { paddingLeft?: unknown; rowGap?: unknown; columnGap?: unknown; label?: unknown }
  children?: unknown[]
}

/**
 * Reads the pane's outer Box: its children and the blank lines between them.
 *
 * @param ui the drawing
 * @returns the outer Box
 */
export async function paneBox(ui: Awaited<ReturnType<typeof mountPane>>): Promise<Drawn> {
  return (await ui.drawn()) as unknown as Drawn
}

/**
 * Reads the pane's blocks: the Boxes under the outer Box that hold rows (each a top-level agent or workflow with
 * everything under it).
 *
 * @param ui the drawing
 * @returns the block Boxes, top to bottom
 */
export async function paneBlocks(ui: Awaited<ReturnType<typeof mountPane>>): Promise<Drawn[]> {
  return drawnChildren(await paneBox(ui)).filter(isBlock)
}

/**
 * Reads the pane as the person sees it: one string per row, a row's indent as that many spaces. The blocks are
 * opened, so their rows read in order.
 *
 * @param ui the drawing
 * @returns the rows, top to bottom
 */
export async function paneLines(ui: Awaited<ReturnType<typeof mountPane>>): Promise<string[]> {
  return drawnChildren(await paneBox(ui))
    .flatMap(child => (isBlock(child) ? drawnChildren(child) : [child]))
    .map(rowText)
}

/**
 * Lists a drawn element's children, leaving out what a `&&` left behind.
 *
 * @param element the element
 * @returns its children
 */
function drawnChildren(element: Drawn): Drawn[] {
  return (element.children ?? []).flat(Infinity).filter(child => child !== false && child != null) as Drawn[]
}

/**
 * Tells a block (a Box that parts its rows) from a row or a line of text.
 *
 * @param node a child of the outer Box
 * @returns true for a block
 */
function isBlock(node: Drawn): boolean {
  return node.type === 'Box' && node.props?.rowGap !== undefined
}

/**
 * Reads one row: its indent (a Box's left padding) as spaces, then its text.
 *
 * @param node the row's node
 * @returns the row as a string
 */
function rowText(node: unknown): string {
  const indent = (node as Drawn).props?.paddingLeft

  return `${' '.repeat(typeof indent === 'number' ? indent : 0)}${textOf(node)}`
}

/**
 * Flattens one drawn node to the text it shows: a Button as its label, a row of parts (a Box with a column gap) with
 * a space between parts.
 *
 * @param node a string, or an element with props and children
 * @returns its text
 */
function textOf(node: unknown): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node)
  }

  const element = node as Drawn

  if (element.type === 'Button' && typeof element.props?.label === 'string') {
    return element.props.label
  }

  const parts = (element.children ?? []).flat(Infinity).filter(child => child !== false && child != null).map(textOf)

  return parts.join(element.props?.columnGap === undefined ? '' : ' ')
}
