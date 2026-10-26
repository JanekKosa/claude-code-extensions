/**
 * Tests of hooks/roster.ts: the roster as plain data, its trimming, its counts and its layout.
 */
import { expect, test } from 'claude-code/testing'

import { blocksOf, countStates, endStateOf, groupRunTimeOf, layOut, withAgent } from '../../hooks/roster'
import type { AgentRow } from '../../types'

/**
 * Makes an agent's row with test defaults.
 *
 * @param id its id
 * @param fields the fields that differ from the defaults
 * @returns the row
 */
function agent(id: string, fields: Partial<AgentRow> = {}): AgentRow {
  return {
    id,
    label: id,
    type: 'general-purpose',
    model: 'haiku-5-5',
    effort: null,
    contextTokens: null,
    parentId: null,
    workflowKey: null,
    isTeammate: false,
    state: 'running',
    startedAt: 0,
    endedAt: null,
    ...fields,
  }
}

/**
 * Reads a layout as `<depth><kind>:<id or key>` strings.
 *
 * @param rows the layout
 * @returns one string per row
 */
function shapeOf(rows: ReturnType<typeof layOut>): string[] {
  return rows.map(row => `${row.depth}${row.kind === 'agent' ? `a:${row.agent.id}` : `w:${row.key}`}`)
}

// ── Changing ──

test('R1 an agent seen again keeps its place', () => {
  const roster = [agent('a'), agent('b')]

  expect(withAgent(roster, agent('a', { state: 'done' }), 10).map(row => `${row.id}:${row.state}`)).toEqual([
    'a:done',
    'b:running',
  ])
})

test('R2 past the limit, the oldest ended agents leave first', () => {
  const roster = [agent('a'), agent('b', { state: 'done' }), agent('c', { state: 'done' })]

  expect(withAgent(roster, agent('d'), 3).map(row => row.id)).toEqual(['a', 'c', 'd'])
})

test('R3 past the limit with every agent live, the oldest leaves', () => {
  expect(withAgent([agent('a'), agent('b')], agent('c'), 2).map(row => row.id)).toEqual(['b', 'c'])
})

test('R4 why a turn ended decides the state', () => {
  expect(endStateOf('answer', false)).toBe('done')
  expect(endStateOf('answer', true)).toBe('idle')
  expect(endStateOf('aborted', false)).toBe('stopped')
  expect(endStateOf('error', false)).toBe('failed')
  expect(endStateOf('refusal', true)).toBe('failed')
})

// ── Reading ──

test('R5 the counts add up by state', () => {
  const counts = countStates([agent('a'), agent('b', { state: 'failed' }), agent('c', { state: 'idle' })])

  expect(counts).toEqual({ running: 1, idle: 1, done: 0, failed: 1, stopped: 0, total: 3 })
})

test('R6 a group runs from its first start to its last end, or to now while one is live', () => {
  const ended = [agent('a', { startedAt: 10, endedAt: 40, state: 'done' }), agent('b', { startedAt: 20, endedAt: 70, state: 'done' })]

  expect(groupRunTimeOf(ended, 1_000)).toBe(60)
  expect(groupRunTimeOf([...ended, agent('c', { startedAt: 30 })], 100)).toBe(90)
  expect(groupRunTimeOf([], 100)).toBe(0)
})

// ── Laying out ──

test('R7 workflow agents sit under one header in the place of the first, children under their parent', () => {
  const roster = [
    agent('solo'),
    agent('w1', { workflowKey: 'wf' }),
    agent('lead'),
    agent('w2', { workflowKey: 'wf' }),
    agent('worker', { parentId: 'lead' }),
    agent('sub', { parentId: 'w2' }),
  ]

  expect(shapeOf(layOut(roster, [], []))).toEqual(['0a:solo', '0w:wf', '1a:w1', '1a:w2', '2a:sub', '0a:lead', '1a:worker'])
})

test('R7b each top-level row starts a block that holds everything under it', () => {
  const roster = [agent('lead'), agent('worker', { parentId: 'lead' }), agent('w1', { workflowKey: 'wf' }), agent('solo')]
  const blocks = blocksOf(layOut(roster, [], [])).map(shapeOf)

  expect(blocks).toEqual([['0a:lead', '1a:worker'], ['0w:wf', '1a:w1'], ['0a:solo']])
  expect(blocksOf([])).toEqual([])
})

test('R8 an agent whose parent is not in the roster sits at the top', () => {
  expect(shapeOf(layOut([agent('orphan', { parentId: 'gone' })], [], []))).toEqual(['0a:orphan'])
})

test('R9 a workflow started by an agent sits under that agent', () => {
  const roster = [agent('lead'), agent('w1', { workflowKey: 'wf', parentId: 'lead' })]

  expect(shapeOf(layOut(roster, [{ key: 'wf', name: 'build' }], []))).toEqual(['0a:lead', '1w:wf', '2a:w1'])
})

test('R10 a finished group is folded unless flipped, a live one open unless flipped', () => {
  const done = [agent('w1', { workflowKey: 'wf', state: 'done' })]
  const live = [agent('w1', { workflowKey: 'wf' })]

  expect(shapeOf(layOut(done, [], []))).toEqual(['0w:wf'])
  expect(shapeOf(layOut(done, [], ['wf']))).toEqual(['0w:wf', '1a:w1'])
  expect(shapeOf(layOut(live, [], []))).toEqual(['0w:wf', '1a:w1'])
  expect(shapeOf(layOut(live, [], ['wf']))).toEqual(['0w:wf'])
})

test('R11 a group is named by its Workflow call, else `workflow`', () => {
  const roster = [agent('w1', { workflowKey: 'wf' }), agent('w2', { workflowKey: 'other' })]
  const names = layOut(roster, [{ key: 'wf', name: 'review-changes' }], []).flatMap(row =>
    row.kind === 'workflow' ? [row.name] : [],
  )

  expect(names).toEqual(['review-changes', 'workflow'])
})
