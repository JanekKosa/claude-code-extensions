/**
 * Following the session's agents: each one as it starts or is resumed (subagents, teammates and every agent a
 * workflow script starts), the effort and context size of each of its model requests, and each end of its turn.
 * Workflow calls are named as their rows are stored, so their agents can be grouped under the workflow's name. A
 * /clear empties the roster.
 */
import type { AgentSpawnInput, EngineInterface, On, TurnUsage } from 'claude-code'

import type { AgentRow } from '../types'
import { firstLine, shorten } from '../utils/text'
import { toolCallBlocks } from '../utils/tool-blocks'
import type { ToolCallBlock } from '../utils/tool-blocks'
import { openPaneUnlessDismissed } from './pane-control'
import { endStateOf } from './roster'
import type { TurnEndReason } from './roster'
import { changeAgent, clearRoster, findAgent, recordAgent, recordWorkflow } from './roster-state'
import type { Settings } from './settings'
import { WORKFLOW_TOOL, workflowNameOf } from './workflow-names'

/** What the tracking uses of the engine interface. */
type TrackingDollar = Pick<EngineInterface, 'clock' | 'state' | 'ui'>

/** The prefix every Claude model id starts with, left out of the pane. */
const MODEL_PREFIX = 'claude-'

// ── Registering ──

/**
 * Registers the hooks that follow the agents: their start, their model requests, their turns' ends, the Workflow
 * calls, and the session's /clear.
 *
 * @param on the module's registrar
 * @param settings the mod's options (autoOpen, maxAgents, labelChars)
 * @returns nothing
 */
export function registerAgentTracking(on: On, settings: Settings): void {
  on('agent.spawn', async ($, e, next) => {
    const spawned = await next(e)

    if (spawned.deny === undefined && spawned.agentId !== undefined) {
      await recordSpawn($, e, spawned.agentId, spawned.model, settings)
    }

    return spawned
  })
  on('turn.start', async ($, e, next) => {
    const started = await next(e)

    if (e.agentId !== undefined) {
      await markRunning($, e.agentId)
    }

    return started
  })
  on('turn.step', async function* ($, e, next) {
    const stepped = yield* next(e)

    if (e.agentId !== undefined) {
      await recordStep($, e.agentId, e.effort, stepped.usage)
    }

    return stepped
  })
  on('turn.complete', async ($, e, next) => {
    const completed = await next(e)

    if (e.agentId !== undefined) {
      await markEnded($, e.agentId, e.reason)
    }

    return completed
  })
  on('session.append', { door: 'response' }, async ($, e, next) => {
    const stored = await next(e)

    await nameWorkflows($, toolCallBlocks(e.message.content))

    return stored
  })
  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await clearRoster($)
    }

    return next(e)
  })
}

// ── Starts ──

/**
 * Records an agent that started, or marks a resumed one running again, and opens the pane by itself when the options
 * ask for it.
 *
 * @param $ the engine interface
 * @param e the spawn, as the hooks beneath left it
 * @param agentId the started agent's id
 * @param model the model it runs on
 * @param settings the mod's options
 * @returns once recorded
 */
async function recordSpawn(
  $: TrackingDollar,
  e: AgentSpawnInput,
  agentId: string,
  model: string,
  settings: Settings,
): Promise<void> {
  const now = await $.clock.now()
  const known = await findAgent($, agentId)
  const row: AgentRow = known
    ? { ...known, state: 'running', startedAt: now, endedAt: null }
    : newAgentRow(e, agentId, model, now, settings.labelChars)

  await recordAgent($, row, settings.maxAgents)

  if (settings.autoOpen) {
    await openPaneUnlessDismissed($)
  }
}

/**
 * Makes the row of an agent the roster has not seen yet.
 *
 * @param e the spawn
 * @param agentId the started agent's id
 * @param model the model it runs on
 * @param now the time now, in milliseconds since the epoch
 * @param labelChars the most characters its label takes
 * @returns its row, running
 */
function newAgentRow(e: AgentSpawnInput, agentId: string, model: string, now: number, labelChars: number): AgentRow {
  return {
    id: agentId,
    label: shorten(labelOf(e), labelChars),
    type: e.subagentType,
    model: model.startsWith(MODEL_PREFIX) ? model.slice(MODEL_PREFIX.length) : model,
    effort: null,
    contextTokens: null,
    parentId: e.parentAgentId ?? null,
    workflowKey: e.workflow ? e.tool_use_id || e.workflow.runId || null : null,
    isTeammate: e.isTeammate === true,
    state: 'running',
    startedAt: now,
    endedAt: null,
  }
}

/**
 * Says what a spawned agent is for, in a few words: the call's description, else its name, else its prompt's first
 * line.
 *
 * @param e the spawn
 * @returns the label; empty when the spawn says nothing at all
 */
function labelOf(e: AgentSpawnInput): string {
  return e.description || e.name || firstLine(e.prompt)
}

// ── Model requests ──

/**
 * Records what one of an agent's model requests was sent with and how full it left the agent's context.
 *
 * @param $ the engine interface
 * @param agentId the agent's id
 * @param effort the request's effort: a level, a token budget, or none for a model without effort
 * @param usage the response's token counts; null when nothing counted
 * @returns once written
 */
async function recordStep(
  $: TrackingDollar,
  agentId: string,
  effort: string | number | undefined,
  usage: TurnUsage | null,
): Promise<void> {
  await changeAgent($, agentId, row => ({
    ...row,
    effort: effort === undefined ? row.effort : String(effort),
    contextTokens: usage === null ? row.contextTokens : contextTokensOf(usage),
  }))
}

/**
 * Counts the tokens a context holds after a response: everything the request sent (fresh, cached and newly cached)
 * plus what the model wrote back.
 *
 * @param usage the response's token counts
 * @returns the context's size, in tokens
 */
function contextTokensOf(usage: TurnUsage): number {
  return (
    usage.input_tokens + usage.cache_read_input_tokens + usage.cache_creation_input_tokens + usage.output_tokens
  )
}

// ── Turns ──

/**
 * Marks an agent running at the start of one of its turns (a teammate woken by a message, a resumed subagent).
 *
 * @param $ the engine interface
 * @param agentId the agent's id
 * @returns once written
 */
async function markRunning($: TrackingDollar, agentId: string): Promise<void> {
  await changeAgent($, agentId, row => (row.state === 'running' ? row : { ...row, state: 'running', endedAt: null }))
}

/**
 * Marks an agent's turn ended: done, idle (a teammate), stopped or failed, by why it ended.
 *
 * @param $ the engine interface
 * @param agentId the agent's id
 * @param reason why the turn ended
 * @returns once written
 */
async function markEnded($: TrackingDollar, agentId: string, reason: TurnEndReason): Promise<void> {
  const now = await $.clock.now()

  await changeAgent($, agentId, row => ({ ...row, state: endStateOf(reason, row.isTeammate), endedAt: now }))
}

// ── Workflow calls ──

/**
 * Names every Workflow call of a stored response, so the agents of its run are grouped under that name.
 *
 * @param $ the engine interface
 * @param calls the response's tool calls, in order
 * @returns once written
 */
async function nameWorkflows($: TrackingDollar, calls: readonly ToolCallBlock[]): Promise<void> {
  for (const call of calls.filter(one => one.name === WORKFLOW_TOOL)) {
    await recordWorkflow($, { key: call.id, name: workflowNameOf(call.input) })
  }
}
