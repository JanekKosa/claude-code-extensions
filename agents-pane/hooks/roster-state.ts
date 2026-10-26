/**
 * The mod's `$.state` values, declared in types/index.d.ts: the roster of agents, the named workflow runs, the clock
 * the running times are drawn against, the workflow groups the person folded or opened, and whether the person closed
 * the pane. Every access to them is in this file, because the engine takes a state reference only from a
 * const of the file that uses it.
 */
import { atom, read, update } from 'claude-code'
import type { StateDollar } from 'claude-code'

import type { AgentRow, WorkflowRow } from '../types'
import { isLive, withAgent, withChangedAgent, withWorkflow } from './roster'

/**
 * The values. Change a `shape` tag when the fields of its rows change: it declines what an earlier version stored,
 * which outlives a reload.
 */
const AGENTS = atom({ plugin: 'agents-pane', key: 'agents' } as const, [], { shape: 'agents-2' })
const WORKFLOWS = atom({ plugin: 'agents-pane', key: 'workflows' } as const, [], { shape: 'workflows-1' })
const NOW = atom({ plugin: 'agents-pane', key: 'now' } as const, 0)
const TOGGLED = atom({ plugin: 'agents-pane', key: 'toggled' } as const, [])
const DISMISSED = atom({ plugin: 'agents-pane', key: 'dismissed' } as const, false)

/** Everything the pane draws from. */
export type Roster = {
  readonly agents: readonly AgentRow[]
  readonly workflows: readonly WorkflowRow[]
  readonly now: number
  readonly toggled: readonly string[]
}

// ── The roster (the agent hooks write, the pane reads) ──

/**
 * Reads everything the pane draws. Read while drawing, it subscribes the drawing, so a later write draws it again.
 *
 * @param $ the engine interface (its state)
 * @returns the roster, the workflow names, the clock and the flipped groups
 */
export async function readRoster($: StateDollar): Promise<Roster> {
  return {
    agents: await read($, AGENTS),
    workflows: await read($, WORKFLOWS),
    now: await read($, NOW),
    toggled: await read($, TOGGLED),
  }
}

/**
 * Puts an agent in the roster, or replaces the row of the one with its id.
 *
 * @param $ the engine interface (its state)
 * @param row the agent
 * @param max the most agents kept
 * @returns once written
 */
export async function recordAgent($: StateDollar, row: AgentRow, max: number): Promise<void> {
  await update($, AGENTS, agents => withAgent(agents, row, max))
}

/**
 * Changes one agent's row; an agent the roster does not hold is left out.
 *
 * @param $ the engine interface (its state)
 * @param id the agent's id
 * @param change makes the new row from the old one
 * @returns once written
 */
export async function changeAgent($: StateDollar, id: string, change: (row: AgentRow) => AgentRow): Promise<void> {
  await update($, AGENTS, agents => withChangedAgent(agents, id, change))
}

/**
 * Finds one agent's row.
 *
 * @param $ the engine interface (its state)
 * @param id the agent's id
 * @returns its row; undefined when the roster does not hold it
 */
export async function findAgent($: StateDollar, id: string): Promise<AgentRow | undefined> {
  return (await read($, AGENTS)).find(agent => agent.id === id)
}

/**
 * Tells whether any agent of the roster still runs or idles.
 *
 * @param $ the engine interface (its state)
 * @returns true while one does
 */
export async function hasLiveAgent($: StateDollar): Promise<boolean> {
  return (await read($, AGENTS)).some(isLive)
}

/**
 * Names a workflow run.
 *
 * @param $ the engine interface (its state)
 * @param row the run's key (its Workflow call's id) and name
 * @returns once written
 */
export async function recordWorkflow($: StateDollar, row: WorkflowRow): Promise<void> {
  await update($, WORKFLOWS, workflows => withWorkflow(workflows, row))
}

/**
 * Empties the roster, the workflow names and the flipped groups: a /clear starts the chat afresh.
 *
 * @param $ the engine interface (its state)
 * @returns once written
 */
export async function clearRoster($: StateDollar): Promise<void> {
  await update($, AGENTS, () => [])
  await update($, WORKFLOWS, () => [])
  await update($, TOGGLED, () => [])
}

// ── The clock (the timer writes, the pane reads) ──

/**
 * Moves the clock the running times are drawn against.
 *
 * @param $ the engine interface (its state)
 * @param now the time now, in milliseconds since the epoch
 * @returns once written
 */
export async function writeNow($: StateDollar, now: number): Promise<void> {
  await update($, NOW, () => now)
}

// ── The person's choices (a workflow's name, the command and the close mark write) ──

/**
 * Folds or opens one workflow group, against the default the pane gives it (open while one of its agents is live).
 *
 * @param $ the engine interface (its state)
 * @param key the workflow run's key
 * @returns once written
 */
export async function toggleWorkflow($: StateDollar, key: string): Promise<void> {
  await update($, TOGGLED, keys => (keys.includes(key) ? keys.filter(one => one !== key) : [...keys, key]))
}

/**
 * Reads whether the person closed the pane, so it is not opened again by itself.
 *
 * @param $ the engine interface (its state)
 * @returns true once closed by the person, until they open it again
 */
export async function isDismissed($: StateDollar): Promise<boolean> {
  return read($, DISMISSED)
}

/**
 * Records whether the person closed the pane.
 *
 * @param $ the engine interface (its state)
 * @param dismissed true when the person closed it, false when they opened it
 * @returns once written
 */
export async function writeDismissed($: StateDollar, dismissed: boolean): Promise<void> {
  await update($, DISMISSED, () => dismissed)
}
