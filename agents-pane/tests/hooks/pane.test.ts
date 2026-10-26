/**
 * Tests of the mod in a session: agents start, send model requests and end, workflows group their agents, and the
 * pane opens, closes and draws what happened, on every surface.
 */
import type { Engine } from 'claude-code/testing'
import { expect, test } from 'claude-code/testing'

import {
  endTurn,
  mountPane,
  paneBlocks,
  paneBox,
  paneLines,
  spawn,
  startSession,
  startTurn,
  step,
  storeCalls,
} from '../support/agent-session'

/** A workflow script as the Workflow tool takes it. */
const REVIEW_SCRIPT = "export const meta = { name: 'review-changes', description: 'Review', phases: [] }\nawait agent('x')"

/** The pane's first lines with no agent. */
const EMPTY = ['0 agents', 'No agents yet. Each one shows here as it starts.']

/**
 * Runs the /agents-pane command as the person does.
 *
 * @param $ the test's engine
 * @returns the command's answer
 */
async function runCommand($: Engine) {
  return $.command.run({
    command: 'agents-pane',
    args: '',
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 80 },
  })
}

/**
 * Draws the pane on vscode and reads it.
 *
 * @param $ the test's engine
 * @returns its rows
 */
async function linesOnVscode($: Engine): Promise<string[]> {
  const ui = await mountPane($, 'vscode')
  const lines = await paneLines(ui)

  await ui.unmount()

  return lines
}

// ── Before any agent ──

test('P1 with no agent the pane says so', async ($, on) => {
  await startSession($, on)

  expect(await linesOnVscode($)).toEqual(EMPTY)
})

// ── One subagent ──

test('P2 a subagent that starts is listed running, and the pane opens by itself', async ($, on) => {
  const session = await startSession($, on)

  await spawn($, { id: 'a1', description: 'find label usages', subagentType: 'Explore' })

  expect(session.log).toEqual(['open agents-pane'])
  expect(await linesOnVscode($)).toEqual(['1 agent · 1 running', '● find label usages · haiku-5-5 · running · 0s'])
})

test('P3 a model request adds the effort and the context size, and the running time counts up', async ($, on) => {
  const session = await startSession($, on)

  await spawn($, { id: 'a1', description: 'find label usages', subagentType: 'Explore' })
  await step($, 'a1', 'high')
  await session.clock.advance(12_000)

  expect(await linesOnVscode($)).toEqual([
    '1 agent · 1 running',
    '● find label usages · haiku-5-5 · high · running · 48k context · 12s',
  ])
})

test('P3b a main-conversation request changes no agent', async ($, on) => {
  await startSession($, on)

  await spawn($, { id: 'a1', description: 'one' })
  await step($, undefined, 'xhigh')

  expect(await linesOnVscode($)).toEqual(['1 agent · 1 running', '● one · haiku-5-5 · running · 0s'])
})

test('P4 a turn that ends marks the agent done, stopped or failed, and its time stops', async ($, on) => {
  const session = await startSession($, on)

  await spawn($, { id: 'a1', description: 'one' })
  await spawn($, { id: 'a2', description: 'two' })
  await spawn($, { id: 'a3', description: 'three' })
  await session.clock.advance(5_000)
  await endTurn($, 'a1', 'answer')
  await endTurn($, 'a2', 'aborted')
  await endTurn($, 'a3', 'error')
  await session.clock.advance(60_000)

  expect(await linesOnVscode($)).toEqual([
    '3 agents · 1 failed',
    '✓ one · haiku-5-5 · done · 5s',
    '■ two · haiku-5-5 · stopped · 5s',
    '✗ three · haiku-5-5 · failed · 5s',
  ])
})

test('P5 a resumed agent runs again, keeping its effort and context size', async ($, on) => {
  await startSession($, on)

  await spawn($, { id: 'a1', description: 'one' })
  await step($, 'a1', 'low')
  await endTurn($, 'a1')
  await spawn($, { id: 'a1', resume: true })

  expect(await linesOnVscode($)).toEqual(['1 agent · 1 running', '● one · haiku-5-5 · low · running · 48k context · 0s'])
})

test('P6 a teammate that answers goes idle, and runs again when its next turn starts', async ($, on) => {
  await startSession($, on)

  await spawn($, { id: 't1', description: 'scout', isTeammate: true, subagentType: 'teammate' })
  await endTurn($, 't1')
  expect(await linesOnVscode($)).toEqual(['1 agent · 1 idle', '○ scout · haiku-5-5 · idle · 0s'])

  await startTurn($, 't1')
  expect(await linesOnVscode($)).toEqual(['1 agent · 1 running', '● scout · haiku-5-5 · running · 0s'])
})

// ── Nesting and spacing ──

test('P7 an agent another agent started sits under it, indented by the option', async ($, on) => {
  await startSession($, on)

  await spawn($, { id: 'lead', description: 'lead task 1', subagentType: 'task-lead' })
  await spawn($, { id: 'w1', description: 'build part A', subagentType: 'software-developer', parentAgentId: 'lead' })
  await spawn($, { id: 'w2', description: 'test part A', parentAgentId: 'w1' })
  await spawn($, { id: 'other', description: 'side search', subagentType: 'Explore' })

  expect(await linesOnVscode($)).toEqual([
    '4 agents · 4 running',
    '● lead task 1 · haiku-5-5 · running · 0s',
    '    ● build part A · haiku-5-5 · running · 0s',
    '        ● test part A · haiku-5-5 · running · 0s',
    '● side search · haiku-5-5 · running · 0s',
  ])
})

test('P7b by default one blank line parts two independent agents, and none parts an agent from those under it', async ($, on) => {
  await startSession($, on)

  await spawn($, { id: 'lead', description: 'lead' })
  await spawn($, { id: 'w1', description: 'worker', parentAgentId: 'lead' })
  await spawn($, { id: 'other', description: 'other' })

  const ui = await mountPane($, 'vscode')
  const blocks = await paneBlocks(ui)

  expect((await paneBox(ui)).props?.rowGap).toBe(1)
  expect(blocks.map(block => [block.props?.rowGap, block.children?.flat(Infinity).length])).toEqual([
    [0, 2],
    [0, 1],
  ])
  await ui.unmount()
})

test('P7c the indent and both spaces follow the options', { options: { indentCells: 2, rowGap: 3, childRowGap: 1 } }, async ($, on) => {
  await startSession($, on)

  await spawn($, { id: 'lead', description: 'lead' })
  await spawn($, { id: 'w1', description: 'worker', parentAgentId: 'lead' })

  const ui = await mountPane($, 'vscode')

  expect((await paneLines(ui))[2]).toBe('  ● worker · haiku-5-5 · running · 0s')
  expect((await paneBox(ui)).props?.rowGap).toBe(3)
  expect((await paneBlocks(ui))[0]?.props?.rowGap).toBe(1)
  await ui.unmount()
})

// ── Workflows ──

test('P8 a workflow agents sit under the workflow name while they run', async ($, on) => {
  const session = await startSession($, on)

  await storeCalls($, [{ name: 'Workflow', id: 'toolu_wf', input: { script: REVIEW_SCRIPT } }])
  await spawn($, { id: 'r1', description: 'review:bugs', workflow: { callId: 'toolu_wf', runId: 'wf_1', agentIndex: 1 } })
  await spawn($, { id: 'r2', description: 'review:perf', workflow: { callId: 'toolu_wf', runId: 'wf_1', agentIndex: 2 } })
  await session.clock.advance(3_000)
  await endTurn($, 'r1')

  expect(await linesOnVscode($)).toEqual([
    '2 agents · 1 running',
    '⏷ review-changes · workflow · 1/2 done · 1 running · 3s',
    '    ✓ review:bugs · haiku-5-5 · done · 3s',
    '    ● review:perf · haiku-5-5 · running · 3s',
  ])
})

test('P9 a finished workflow folds, and a press on its arrow opens and folds it again', async ($, on) => {
  await startSession($, on)

  await storeCalls($, [{ name: 'Workflow', id: 'toolu_wf', input: { script: REVIEW_SCRIPT } }])
  await spawn($, { id: 'r1', description: 'review:bugs', workflow: { callId: 'toolu_wf', runId: 'wf_1', agentIndex: 1 } })
  await endTurn($, 'r1', 'error')
  await spawn($, { id: 'solo', description: 'solo' })

  const ui = await mountPane($, 'vscode')
  const folded = ['2 agents · 1 running · 1 failed', '⏵ review-changes · workflow · 0/1 done · 1 failed · 0s', '● solo · haiku-5-5 · running · 0s']

  expect(await paneLines(ui)).toEqual(folded)
  await ui.press({ key: 'workflow-toolu_wf' })
  expect(await paneLines(ui)).toEqual([
    '2 agents · 1 running · 1 failed',
    '⏷ review-changes · workflow · 0/1 done · 1 failed · 0s',
    '    ✗ review:bugs · haiku-5-5 · failed · 0s',
    '● solo · haiku-5-5 · running · 0s',
  ])
  await ui.press({ key: 'workflow-toolu_wf' })
  expect(await paneLines(ui)).toEqual(folded)
  await ui.unmount()
})

test('P9b only the arrow is a button, a faint one, and the header row does not wrap', async ($, on) => {
  await startSession($, on)

  await spawn($, { id: 'r1', description: 'step', workflow: { callId: 'toolu_wf', runId: 'wf_1', agentIndex: 1 } })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await mountPane($, surface)
    const buttons = await ui.findAll({ type: 'Button' })

    expect(buttons.map(button => button.props)).toEqual([
      { key: 'workflow-toolu_wf', label: '⏷', plain: true, dimColor: true },
    ])
    expect(await ui.find({ type: 'Text', text: /^workflow · workflow · 0\/1 done/ })).toBeDefined()
    await ui.unmount()
  }

  const ui = await mountPane($, 'vscode')
  const rows = (await ui.findAll({ type: 'Box', text: /workflow · 0\/1 done/ })).filter(
    box => box.props.flexDirection === 'row',
  )

  expect(rows.map(box => box.props)).toEqual([{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', columnGap: 1 }])
  await ui.unmount()
})

test('P10 a workflow with no Workflow call seen is still grouped, under its run id', async ($, on) => {
  await startSession($, on)

  await spawn($, { id: 'r1', description: 'step', workflow: { callId: '', runId: 'wf_9', agentIndex: 1 } })

  expect(await linesOnVscode($)).toEqual([
    '1 agent · 1 running',
    '⏷ workflow · workflow · 0/1 done · 1 running · 0s',
    '    ● step · haiku-5-5 · running · 0s',
  ])
})

// ── Opening and closing ──

test('P11 the pane hidden by the command stays hidden when agents start, until the command shows it again', async ($, on) => {
  const session = await startSession($, on)

  await spawn($, { id: 'a1', description: 'one' })
  expect((await runCommand($)).text).toBe('Agents pane hidden.')
  await spawn($, { id: 'a2', description: 'two' })
  expect(session.openPanes.has('agents-pane')).toBe(false)

  expect((await runCommand($)).text).toBe('Agents pane shown.')
  expect(session.openPanes.has('agents-pane')).toBe(true)
  expect(session.log).toEqual(['open agents-pane', 'close agents-pane by plugin', 'open agents-pane'])
})

test('P12 with autoOpen off, the pane opens only on the command', { options: { autoOpen: false } }, async ($, on) => {
  const session = await startSession($, on)

  await spawn($, { id: 'a1', description: 'one' })
  expect(session.openPanes.has('agents-pane')).toBe(false)
  expect((await runCommand($)).text).toBe('Agents pane shown.')
})

test('P13 a /clear empties the pane', async ($, on) => {
  await startSession($, on)

  await spawn($, { id: 'a1', description: 'one' })
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } })

  expect(await linesOnVscode($)).toEqual(EMPTY)
})

test('P14 the pane draws the same rows on every surface', async ($, on) => {
  await startSession($, on)

  await spawn($, { id: 'a1', description: 'one' })

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await mountPane($, surface)

    expect(await paneLines(ui)).toEqual(['1 agent · 1 running', '● one · haiku-5-5 · running · 0s'])
    await ui.unmount()
  }
})
