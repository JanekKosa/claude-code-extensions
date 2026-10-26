/**
 * The roster of agents as plain data: changing it (an agent starts, is resumed, ends, takes a step), counting it, and
 * laying it out as the pane's rows, a workflow's agents grouped under their workflow and each agent's own subagents
 * under it. Nothing here touches the engine; roster-state.ts stores what these functions return.
 */
import type { AgentRow, AgentState, WorkflowRow } from '../types'

/** How many agents stand in each state, and in all. */
export type Counts = Readonly<Record<AgentState, number>> & { readonly total: number }

/** One row of the pane: an agent, or a workflow's header with the agents of its run. */
export type PaneRow =
  | { readonly kind: 'agent'; readonly depth: number; readonly agent: AgentRow }
  | {
      readonly kind: 'workflow'
      readonly depth: number
      readonly key: string
      readonly name: string
      readonly members: readonly AgentRow[]
      readonly isOpen: boolean
    }

/** Why a turn ended, as `turn.complete` says it. */
export type TurnEndReason = 'answer' | 'aborted' | 'refusal' | 'error'

/** The states in which an agent still works or waits to be woken. */
const LIVE_STATES: readonly AgentState[] = ['running', 'idle']

/** What a workflow is called when no Workflow call named it (a resumed run, a run started before the mod loaded). */
const UNKNOWN_WORKFLOW = 'workflow'

// ── Changing the roster ──

/**
 * Puts an agent in the roster: in its own place when its id is there already (a resumed agent), else last. The
 * oldest ended agents leave once the roster holds more than `max`.
 *
 * @param agents the roster
 * @param row the agent
 * @param max the most agents kept
 * @returns the new roster
 */
export function withAgent(agents: readonly AgentRow[], row: AgentRow, max: number): AgentRow[] {
  const isKnown = agents.some(agent => agent.id === row.id)
  const next = isKnown ? agents.map(agent => (agent.id === row.id ? row : agent)) : [...agents, row]

  return trimmed(next, max)
}

/**
 * Changes one agent of the roster; an id the roster does not hold changes nothing.
 *
 * @param agents the roster
 * @param id the agent's id
 * @param change makes the agent's new row from its old one
 * @returns the new roster
 */
export function withChangedAgent(
  agents: readonly AgentRow[],
  id: string,
  change: (row: AgentRow) => AgentRow,
): AgentRow[] {
  return agents.map(agent => (agent.id === id ? change(agent) : agent))
}

/**
 * Names a workflow run: replaces the name under its key, or adds it last.
 *
 * @param workflows the named runs
 * @param row the run's key and name
 * @returns the new list
 */
export function withWorkflow(workflows: readonly WorkflowRow[], row: WorkflowRow): WorkflowRow[] {
  return [...workflows.filter(workflow => workflow.key !== row.key), row]
}

/**
 * Drops the oldest ended agents, then the oldest of any, until at most `max` are left.
 *
 * @param agents the roster
 * @param max the most agents kept
 * @returns the roster, at most `max` long, in its order
 */
function trimmed(agents: readonly AgentRow[], max: number): AgentRow[] {
  const kept = [...agents]

  while (kept.length > max) {
    const oldestEnded = kept.findIndex(agent => !isLive(agent))

    kept.splice(oldestEnded === -1 ? 0 : oldestEnded, 1)
  }

  return kept
}

/**
 * The state an agent's turn leaves it in: a teammate that answered waits for its next message; any other agent that
 * answered is done; an interrupted one is stopped; a refusal or an error failed it.
 *
 * @param reason why the turn ended
 * @param isTeammate whether the agent is a teammate
 * @returns the agent's new state
 */
export function endStateOf(reason: TurnEndReason, isTeammate: boolean): AgentState {
  switch (reason) {
    case 'answer':
      return isTeammate ? 'idle' : 'done'
    case 'aborted':
      return 'stopped'
    default:
      return 'failed'
  }
}

// ── Reading the roster ──

/**
 * Counts the agents in each state.
 *
 * @param agents the roster
 * @returns the count per state and in all
 */
export function countStates(agents: readonly AgentRow[]): Counts {
  const counts = { running: 0, idle: 0, done: 0, failed: 0, stopped: 0 }

  for (const agent of agents) {
    counts[agent.state] += 1
  }

  return { ...counts, total: agents.length }
}

/**
 * Tells whether an agent still works or waits to be woken.
 *
 * @param agent the agent
 * @returns true while it runs or idles
 */
export function isLive(agent: AgentRow): boolean {
  return LIVE_STATES.includes(agent.state)
}

/**
 * Measures how long an agent has run: to its end once it ended, else to `now`.
 *
 * @param agent the agent
 * @param now the time now, in milliseconds since the epoch
 * @returns the length, in milliseconds; never negative
 */
export function runTimeOf(agent: AgentRow, now: number): number {
  return Math.max(0, (agent.endedAt ?? now) - agent.startedAt)
}

/**
 * Measures how long a group of agents has run: from the first start to the last end, or to `now` while one is live.
 *
 * @param agents the group
 * @param now the time now, in milliseconds since the epoch
 * @returns the length, in milliseconds; 0 for no agents
 */
export function groupRunTimeOf(agents: readonly AgentRow[], now: number): number {
  if (agents.length === 0) {
    return 0
  }

  const start = Math.min(...agents.map(agent => agent.startedAt))
  const end = Math.max(...agents.map(agent => (isLive(agent) ? now : (agent.endedAt ?? now))))

  return Math.max(0, end - start)
}

// ── Laying out the pane ──

/**
 * Lays the roster out as the pane's rows, in the order agents started. A workflow's agents sit under one header, in
 * the place of its first agent; each agent's own subagents sit under it, one step deeper. An agent whose parent the
 * roster does not hold sits at the top.
 *
 * @param agents the roster
 * @param workflows the named workflow runs
 * @param toggled the workflow keys the person folded or opened against their default (open while an agent is live)
 * @returns the rows, top to bottom; a folded workflow's agents left out
 */
export function layOut(
  agents: readonly AgentRow[],
  workflows: readonly WorkflowRow[],
  toggled: readonly string[],
): PaneRow[] {
  const children = childrenByParent(agents)
  const rows: PaneRow[] = []
  const placedGroups = new Set<string>()

  const placeChildren = (parentId: string | null, depth: number): void => {
    for (const child of children.get(parentId) ?? []) {
      if (child.workflowKey === null) {
        placeAgent(child, depth)
      } else if (!placedGroups.has(child.workflowKey)) {
        placedGroups.add(child.workflowKey)
        placeGroup(child.workflowKey, depth)
      }
    }
  }

  const placeAgent = (agent: AgentRow, depth: number): void => {
    rows.push({ kind: 'agent', depth, agent })
    placeChildren(agent.id, depth + 1)
  }

  const placeGroup = (key: string, depth: number): void => {
    const members = agents.filter(agent => agent.workflowKey === key)
    const isOpen = members.some(isLive) !== toggled.includes(key)

    rows.push({ kind: 'workflow', depth, key, name: workflowName(workflows, key), members, isOpen })

    if (isOpen) {
      members.forEach(member => placeAgent(member, depth + 1))
    }
  }

  placeChildren(null, 0)

  return rows
}

/**
 * Cuts the pane's rows into blocks: each top-level row (depth 0) starts one, and everything under it belongs to it.
 *
 * @param rows the pane's rows, as layOut returns them
 * @returns the blocks, top to bottom, each its rows in order
 */
export function blocksOf(rows: readonly PaneRow[]): PaneRow[][] {
  const blocks: PaneRow[][] = []

  for (const row of rows) {
    const current = blocks[blocks.length - 1]

    if (row.depth === 0 || current === undefined) {
      blocks.push([row])
    } else {
      current.push(row)
    }
  }

  return blocks
}

/**
 * Lists each agent's children in start order, keyed by the parent's id; an agent whose parent the roster does not
 * hold is listed under null, with the main conversation's own.
 *
 * @param agents the roster
 * @returns the children of each parent
 */
function childrenByParent(agents: readonly AgentRow[]): Map<string | null, AgentRow[]> {
  const ids = new Set(agents.map(agent => agent.id))
  const children = new Map<string | null, AgentRow[]>()

  for (const agent of agents) {
    const parent = agent.parentId !== null && ids.has(agent.parentId) ? agent.parentId : null

    children.set(parent, [...(children.get(parent) ?? []), agent])
  }

  return children
}

/**
 * Finds a workflow run's name.
 *
 * @param workflows the named runs
 * @param key the run's key
 * @returns its name; `workflow` when no Workflow call named it
 */
function workflowName(workflows: readonly WorkflowRow[], key: string): string {
  return workflows.find(workflow => workflow.key === key)?.name ?? UNKNOWN_WORKFLOW
}
