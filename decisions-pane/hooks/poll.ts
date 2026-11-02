/**
 * Following the registers: at session start and then every `pollMs` and after each answer, the mod looks at whether
 * this chat is switched on for the agent team, finds and reads the register, writes the entries that wait for the person
 * and the notice of answers, or a register, that could not be read, and brings the pane in line. A change of the answers
 * log is noticed like a change of the open file.
 *
 * In a chat outside the team the mod also hands the person's answers to the chat, which the team's watch and prompt hook
 * do in a team chat: after an answer once no entry waits for the person, and every 30 minutes whatever was answered so
 * far. Every chat of a repo shows the same register, so only a chat where the person answered hands answers over: an
 * unrelated chat open on that repo is not woken with them.
 */
import type { EngineInterface } from 'claude-code'

import { readCwd, writeCwd, writeDecisions, writeLogNotice } from './decision-state'
import { followWaiting } from './pane-control'
import { findRegisters, readWaitingDecisions, takeAnswers } from './registers'
import type { RegisterLocation, Snapshot } from './registers'
import type { Settings } from './settings'
import { lookAtChatMode, standaloneSettings } from './team-switch'
import type { ChatMode } from './team-switch'

/** What a read of the registers uses of the engine interface. */
export type PollDollar = Pick<EngineInterface, 'fs' | 'process' | 'env' | 'ui' | 'state' | 'clock' | 'session' | 'prompt'>

/** How often a chat gets the answers given so far, while some entries still wait for the person. */
const HAND_OVER_EVERY_MS = 30 * 60_000

/**
 * The registers of this session, found at the first look and at a change of mode. A reload starts the session's hooks
 * again and finds them anew.
 */
let registers: readonly RegisterLocation[] = []

/** Whose scripts this chat uses, as the last look that could tell found it. */
let mode: ChatMode = 'standalone'

/** True from an answer in this chat until answers reach it; only then does the 30-minute hand-over run. */
let hasAnswerToHandOver = false

/** What each register held at its last read, by open file path, so an unchanged register is not read again. */
const snapshots = new Map<string, Snapshot>()

/** When each register's reads began to fail, by open file path, while they fail, so the pane can say they do. */
const failingSince = new Map<string, number>()

/** True while a read runs, so a timer tick that comes during one does not start a second. */
let isReading = false

/**
 * Starts following the registers when the session starts: looks at the team's switch, finds and reads the registers,
 * and starts the timers that do it again and hand answers over.
 *
 * @param $ the engine interface
 * @param cwd the folder the session started in
 * @param settings the mod's options (pollMs and those the reads use)
 * @returns once first read
 */
export async function startPoll($: PollDollar, cwd: string, settings: Settings): Promise<void> {
  await writeCwd($, cwd)
  registers = []
  mode = 'standalone'
  hasAnswerToHandOver = false
  snapshots.clear()
  failingSince.clear()
  await readRegisters($, settings)
  $.clock.every(settings.pollMs, () => void readRegisters($, settings))
  $.clock.every(HAND_OVER_EVERY_MS, () => void handOverAnswers($, settings, false))
}

/**
 * Gives the options as this chat uses them: the register script is the one of the switch that is on.
 *
 * @param settings the mod's options
 * @returns the options; the `decisions` skill's script in a chat outside the agent team
 */
export function chatSettings(settings: Settings): Settings {
  return mode === 'standalone' ? standaloneSettings(settings) : settings
}

/**
 * Looks at the team's switch, reads the registers, and brings the pane in line. A look that fails keeps the last mode.
 * A read asked while one runs is skipped: the next tick reads.
 *
 * @param $ the engine interface
 * @param settings the mod's options
 * @returns once in line
 */
export async function readRegisters($: PollDollar, settings: Settings): Promise<void> {
  if (isReading) {
    return
  }

  isReading = true

  try {
    const looked = (await lookAtChatMode($, settings)) ?? mode

    if (looked !== mode) {
      mode = looked
      registers = []
    }

    if (registers.length === 0) {
      const cwd = await readCwd($)

      registers = cwd === '' ? [] : await findRegisters($, cwd, chatSettings(settings))
    }

    const found = await readWaitingDecisions($, registers, snapshots, failingSince)

    await writeDecisions($, found.rows)
    await writeLogNotice($, found.logNotice)
    await followWaiting($, settings)
  } finally {
    isReading = false
  }
}

/**
 * Hands over after the person answered in this chat, if nothing still waits for them; else the 30-minute look will.
 *
 * @param $ the engine interface
 * @param settings the mod's options
 * @returns once handed over, or when there is nothing to hand over yet
 */
export async function handOverAfterAnswer($: PollDollar, settings: Settings): Promise<void> {
  hasAnswerToHandOver = true
  await handOverAnswers($, settings, true)
}

/**
 * Sends the answers that wait to the chat, as a prompt of its own once the session is idle. Only outside the team: in a
 * team chat the team's watch and prompt hook do it. The prompt goes as the person's own words, which it holds.
 *
 * @param $ the engine interface
 * @param settings the mod's options
 * @param whenAllAnswered true to send them only once no entry waits for the person
 * @returns once sent to the prompt queue, or when there is nothing to send
 */
async function handOverAnswers($: PollDollar, settings: Settings, whenAllAnswered: boolean): Promise<void> {
  const register = registers[0]

  if (mode !== 'standalone' || !hasAnswerToHandOver || register === undefined) {
    return
  }

  const text = await takeAnswers($, register, whenAllAnswered, chatSettings(settings))

  if (text !== '') {
    hasAnswerToHandOver = false
    void $.prompt.submit({ text, asUser: true })
  }
}
