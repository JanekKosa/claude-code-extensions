/**
 * The Agents pane: the /agents-pane command that shows or hides it, the timer that keeps running times current, the
 * person's close mark, and the drawing itself: a summary line, then one line per agent, a workflow's agents under a
 * header line whose arrow, a faint button, folds or opens them.
 */
import type { EngineInterface, On, RenderElement, RenderInput } from 'claude-code'

import type { AgentRow, AgentState } from '../types'
import { formatDuration } from '../utils/duration'
import { optional } from '../utils/lists'
import { formatTokens } from '../utils/tokens'
import { PANE_ID, closePaneForPerson, isPaneOpen, openPaneForPerson } from './pane-control'
import { blocksOf, countStates, groupRunTimeOf, layOut, runTimeOf } from './roster'
import type { Counts, PaneRow } from './roster'
import { hasLiveAgent, readRoster, toggleWorkflow, writeDismissed, writeNow } from './roster-state'
import type { Settings } from './settings'

/** What the clock tick uses of the engine interface. */
type TickDollar = Pick<EngineInterface, 'clock' | 'state'>

/** The slash command that shows or hides the pane. */
const COMMAND = 'agents-pane'

/** The mark and the theme color of each state. */
const MARKS: Readonly<Record<AgentState, { readonly mark: string; readonly color: string }>> = {
  running: { mark: '●', color: 'claude' },
  idle: { mark: '○', color: 'inactive' },
  done: { mark: '✓', color: 'success' },
  failed: { mark: '✗', color: 'error' },
  stopped: { mark: '■', color: 'warning' },
}

/**
 * The arrow of a workflow's header, down while open and right while folded: the medium triangles, a step smaller than
 * ▼ and ▶. The VS Code chat ignores a Text's `size`, so the size comes from the character.
 */
const ARROW_OPEN = '⏷'
const ARROW_FOLDED = '⏵'

// ── Registering ──

/**
 * Registers the pane's command, its timer, its close mark and its drawing.
 *
 * @param on the module's registrar
 * @param settings the mod's options (tickMs, rowGap, childRowGap, indentCells)
 * @returns nothing
 */
export function registerPane(on: On, settings: Settings): void {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: COMMAND, description: 'Show or hide the Agents pane: every agent of this session' })
    $.clock.every(settings.tickMs, () => void tick($))

    return next(e)
  })
  on('command.run', { command: COMMAND }, async $ => {
    if (await isPaneOpen($)) {
      await closePaneForPerson($)

      return { text: 'Agents pane hidden.' }
    }

    const opened = await openPaneForPerson($)

    return { text: opened.isPlaced ? 'Agents pane shown.' : `Agents pane waits: ${opened.reason}` }
  })
  on('ui.close', async ($, e, next) => {
    if (e.id === PANE_ID && e.origin.kind === 'person') {
      await writeDismissed($, true)
    }

    return next(e)
  })
  on('ui.render', { component: 'Pane', requestId: PANE_ID }, async ($, e) => drawPane($, e, settings))
}

// ── The clock ──

/**
 * Moves the pane's clock while an agent is live, so the running times count up; with none live it writes nothing
 * and nothing is redrawn.
 *
 * @param $ the engine interface
 * @returns once written
 */
async function tick($: TickDollar): Promise<void> {
  if (await hasLiveAgent($)) {
    await writeNow($, await $.clock.now())
  }
}

// ── Drawing ──

/**
 * Draws the pane: the summary, then one block per top-level agent or workflow, or a line saying no agent has started
 * yet. Blocks are parted by `rowGap` blank lines; the rows inside a block (an agent and the agents under it) by the
 * smaller `childRowGap`.
 *
 * @param $ the engine interface
 * @param e the render event of the pane
 * @param settings the mod's options (rowGap, childRowGap, indentCells)
 * @returns the tree drawn
 */
async function drawPane($: EngineInterface, e: RenderInput<'Pane'>, settings: Settings): Promise<RenderElement> {
  const { Box, Text } = $.ui.resolve(e)
  const roster = await readRoster($)
  const now = Math.max(roster.now, ...roster.agents.map(agent => agent.startedAt))
  const blocks = blocksOf(layOut(roster.agents, roster.workflows, roster.toggled))

  return (
    <Box flexDirection="column" rowGap={settings.rowGap}>
      <Text weight="semibold">{summaryOf(countStates(roster.agents))}</Text>
      {blocks.length === 0 && <Text dimColor>No agents yet. Each one shows here as it starts.</Text>}
      {blocks.map(block => (
        <Box flexDirection="column" rowGap={settings.childRowGap}>
          {block.map(row => (
            <Box paddingLeft={row.depth * settings.indentCells}>
              {row.kind === 'agent' ? drawAgent($, e, row.agent, now) : drawWorkflow($, e, row, now)}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  )
}

/**
 * Draws one agent's line: its mark and name, then its model, effort, status, context size and running time. The
 * effort and context size are left out until its first model request has answered.
 *
 * @param $ the engine interface
 * @param e the render event of the pane
 * @param agent the agent
 * @param now the time the running time counts to
 * @returns the line, such as `● review:perf · sonnet-5-5 · high · running · 48k context · 38s`
 */
function drawAgent($: EngineInterface, e: RenderInput<'Pane'>, agent: AgentRow, now: number): RenderElement {
  const { Text } = $.ui.resolve(e)
  const { mark, color } = MARKS[agent.state]

  return (
    <Text wrap="truncate-end">
      <Text color={color}>{mark}</Text> {agent.label || agent.type}
      <Text dimColor>{` · ${[agent.model, ...optional(agent.effort)].join(' · ')} · `}</Text>
      <Text color={color}>{agent.state}</Text>
      <Text dimColor>{` · ${[...optional(contextOf(agent)), formatDuration(runTimeOf(agent, now))].join(' · ')}`}</Text>
    </Text>
  )
}

/**
 * Draws a workflow's header line: its arrow, a faint button that folds or opens the workflow, then its name and how
 * many of its agents are done, running and failed, and how long it has run, as plain text. The row does not wrap, so
 * the text stays beside the arrow.
 *
 * @param $ the engine interface
 * @param e the render event of the pane
 * @param row the workflow's row
 * @param now the time the running times count to
 * @returns the header, such as `▼ review-changes · workflow · 1/2 done · 1 running · 38s`
 */
function drawWorkflow(
  $: EngineInterface,
  e: RenderInput<'Pane'>,
  row: Extract<PaneRow, { kind: 'workflow' }>,
  now: number,
): RenderElement {
  const { Box, Button, Text } = $.ui.resolve(e)
  const counts = countStates(row.members)
  const details = [
    'workflow',
    `${counts.done}/${counts.total} done`,
    ...(counts.running > 0 ? [`${counts.running} running`] : []),
    ...(counts.failed > 0 ? [`${counts.failed} failed`] : []),
    formatDuration(groupRunTimeOf(row.members, now)),
  ].join(' · ')

  return (
    <Box flexDirection="row" flexWrap="nowrap" alignItems="center" columnGap={1}>
      <Button
        key={`workflow-${row.key}`}
        label={row.isOpen ? ARROW_OPEN : ARROW_FOLDED}
        plain
        dimColor
        onPress={() => void toggleWorkflow($, row.key)}
      />
      <Text wrap="truncate-end">
        <Text weight="semibold">{row.name}</Text>
        <Text dimColor>{` · ${details}`}</Text>
      </Text>
    </Box>
  )
}

// ── Wording ──

/**
 * Writes the summary line: how many agents, and how many run, idle and failed.
 *
 * @param counts the roster's counts
 * @returns such as `7 agents · 3 running · 1 failed`
 */
function summaryOf(counts: Counts): string {
  return [
    `${counts.total} ${counts.total === 1 ? 'agent' : 'agents'}`,
    ...(counts.running > 0 ? [`${counts.running} running`] : []),
    ...(counts.idle > 0 ? [`${counts.idle} idle`] : []),
    ...(counts.failed > 0 ? [`${counts.failed} failed`] : []),
  ].join(' · ')
}

/**
 * Writes an agent's context size.
 *
 * @param agent the agent
 * @returns such as `48k context`; null before its first model request has answered
 */
function contextOf(agent: AgentRow): string | null {
  return agent.contextTokens === null ? null : `${formatTokens(agent.contextTokens)} context`
}
