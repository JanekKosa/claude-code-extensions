/**
 * Tests of a chat outside the agent team, the usual kind: the pane shows without any switch, answers go through the
 * `decisions` skill's register.mjs, and the mod hands them to the chat, which the team's watch and prompt hook do in a
 * team chat.
 */
import { expect, test } from 'claude-code/testing'

import {
  CONFIG,
  REPO,
  SCRIPT,
  STANDALONE_CONFIG,
  STANDALONE_CONFIG_TEXT,
  STANDALONE_SCRIPT,
  mountPane,
  runCommand,
  startWorld,
  switchOff,
  writeOpen,
} from '../support/register-world'
import type { World } from '../support/register-world'

/** What `register.mjs handover` prints for one answer, shortened. */
const HANDED = 'DECISION ANSWERS | D-12\nD-12, answered 2026-10-26 11:30:\nAgreed.'

/** Half an hour of engine time, the period of the hand-over of whatever was answered so far. */
const HALF_HOUR_MS = 30 * 60_000

/** Options that leave out the 900 register reads half an hour would hold, too many for a test's time limit. */
const NO_POLLS = { options: { pollMs: 2 * HALF_HOUR_MS } }

/**
 * Makes the machine one without the agent team: no team settings, no marker, only the skill.
 *
 * @param world the stand-ins
 */
const outsideTheTeam = (world: World) => {
  switchOff(world)
  world.files.delete(CONFIG)
  world.files.set(STANDALONE_CONFIG, STANDALONE_CONFIG_TEXT)
}

/** The press target of an entry's Submit button in the session's repo. */
const submitOf = (id: string) => ({ key: `submit:${REPO}::${id}` })

/** What the session's handover runs were asked, each as its arguments after the script. */
const handovers = (world: World) => world.runs.filter(args => args[0] === 'handover')

test('A1 a chat that typed nothing shows the pane when a decision waits', async ($, on) => {
  const world = await startWorld($, on, w => {
    outsideTheTeam(w)
    writeOpen(w, [{ id: 'D-12' }])
  })

  expect(world.openPanes.get('decisions-pane')).toBe('Decisions (1)')
})

test('A2 with nothing waiting there is no tab, and the command says so', async ($, on) => {
  const world = await startWorld($, on, outsideTheTeam)

  expect(world.openPanes.size).toBe(0)
  expect(await runCommand($)).toMatchObject({ text: 'No decisions wait for you.' })
})

test('A3 the answer goes through the skill\'s register.mjs, not the team\'s', async ($, on) => {
  const world = await startWorld($, on, w => {
    outsideTheTeam(w)
    writeOpen(w, [{ id: 'D-12' }])
  })
  const ui = await mountPane($)

  await ui.press(submitOf('D-12'))

  expect(world.programs[0]).toEqual(['node', STANDALONE_SCRIPT])
  expect(world.runs[0]?.[0]).toBe('answer')
})

test('A4 the last answer reaches the chat as a prompt', async ($, on) => {
  const world = await startWorld($, on, w => {
    outsideTheTeam(w)
    writeOpen(w, [{ id: 'D-12' }])
  })
  const ui = await mountPane($)

  world.handover = `${HANDED}\n`
  await ui.press(submitOf('D-12'))

  expect(handovers(world)).toEqual([['handover', '--when-all-answered', '--root', REPO]])
  expect(world.prompts).toEqual([HANDED])
})

test('A5 while another entry waits, handover hands nothing and the chat gets no prompt', async ($, on) => {
  const world = await startWorld($, on, w => {
    outsideTheTeam(w)
    writeOpen(w, [{ id: 'D-12' }, { id: 'D-13' }])
  })
  const ui = await mountPane($)

  await ui.press(submitOf('D-12'))

  expect(handovers(world)).toHaveLength(1)
  expect(world.prompts).toEqual([])
})

test('A6 30 minutes after an answer it goes to the chat, though another entry waits', NO_POLLS, async ($, on) => {
  const world = await startWorld($, on, w => {
    outsideTheTeam(w)
    writeOpen(w, [{ id: 'D-12' }, { id: 'D-13' }])
  })
  const ui = await mountPane($)

  await ui.press(submitOf('D-12'))
  world.handover = HANDED
  await world.clock.advance(HALF_HOUR_MS)

  expect(handovers(world)).toEqual([
    ['handover', '--when-all-answered', '--root', REPO],
    ['handover', '--root', REPO],
  ])
  expect(world.prompts).toEqual([HANDED])
})

test('A7 a chat where nothing was answered hands nothing over, so another chat\'s answers stay for it', NO_POLLS, async ($, on) => {
  const world = await startWorld($, on, w => {
    outsideTheTeam(w)
    writeOpen(w, [{ id: 'D-13' }])
  })

  world.handover = HANDED
  await world.clock.advance(HALF_HOUR_MS)

  expect(handovers(world)).toEqual([])
  expect(world.prompts).toEqual([])
})

test('A8 once its answers are handed over, the chat stops looking', NO_POLLS, async ($, on) => {
  const world = await startWorld($, on, w => {
    outsideTheTeam(w)
    writeOpen(w, [{ id: 'D-12' }])
  })
  const ui = await mountPane($)

  world.handover = HANDED
  await ui.press(submitOf('D-12'))
  await world.clock.advance(HALF_HOUR_MS)

  expect(handovers(world)).toHaveLength(1)
})

test('A9 a hand-over that fails sends nothing and is tried again 30 minutes later', NO_POLLS, async ($, on) => {
  const world = await startWorld($, on, w => {
    outsideTheTeam(w)
    writeOpen(w, [{ id: 'D-12' }, { id: 'D-13' }])
  })
  const ui = await mountPane($)

  await ui.press(submitOf('D-12'))
  world.failNext = { exitCode: 1, stderr: 'register: busy' }
  await world.clock.advance(HALF_HOUR_MS)

  expect(world.prompts).toEqual([])

  world.handover = HANDED
  await world.clock.advance(HALF_HOUR_MS)

  expect(world.prompts).toEqual([HANDED])
})

test('A10 a team chat keeps the team\'s script and hands nothing over, as the team\'s watch does that', NO_POLLS, async ($, on) => {
  const world = await startWorld($, on, w => writeOpen(w, [{ id: 'D-12' }]))
  const ui = await mountPane($)

  await ui.press(submitOf('D-12'))
  await world.clock.advance(HALF_HOUR_MS)

  expect(world.programs[0]).toEqual(['node', SCRIPT])
  expect(handovers(world)).toEqual([])
  expect(world.prompts).toEqual([])
})
