/**
 * Following the registers: at session start the mod finds them, then reads them every `pollMs` and after each answer,
 * writes the entries that wait for the person and the notice of answers, or a register, that could not be read, and
 * brings the pane in line. A change of the answers log is noticed like a change of the open file.
 */
import type { EngineInterface } from 'claude-code'

import { readCwd, writeCwd, writeDecisions, writeLogNotice } from './decision-state'
import { followWaiting } from './pane-control'
import { findRegisters, readWaitingDecisions } from './registers'
import type { RegisterLocation, Snapshot } from './registers'
import type { Settings } from './settings'

/** What a read of the registers uses of the engine interface. */
export type PollDollar = Pick<EngineInterface, 'fs' | 'process' | 'env' | 'ui' | 'state' | 'clock'>

/** The registers of this session, found at its start. A reload starts the session's hooks again and finds them anew. */
let registers: readonly RegisterLocation[] = []

/** What each register held at its last read, by open file path, so an unchanged register is not read again. */
const snapshots = new Map<string, Snapshot>()

/** When each register's reads began to fail, by open file path, while they fail, so the pane can say they do. */
const failingSince = new Map<string, number>()

/** True while a read runs, so a timer tick that comes during one does not start a second. */
let isReading = false

/**
 * Starts following the registers when the session starts: finds them, reads them, and starts the timer that reads
 * them again.
 *
 * @param $ the engine interface
 * @param cwd the folder the session started in
 * @param settings the mod's options (pollMs and those the reads use)
 * @returns once first read
 */
export async function startPoll($: PollDollar, cwd: string, settings: Settings): Promise<void> {
  await writeCwd($, cwd)
  registers = await findRegisters($, cwd, settings)
  snapshots.clear()
  failingSince.clear()
  await readRegisters($, settings)
  $.clock.every(settings.pollMs, () => void readRegisters($, settings))
}

/**
 * Reads the registers and brings the pane in line. A read asked while one runs is skipped: the next tick reads.
 *
 * @param $ the engine interface
 * @param settings the mod's options
 * @returns once read
 */
export async function readRegisters($: PollDollar, settings: Settings): Promise<void> {
  if (isReading) {
    return
  }

  isReading = true

  try {
    if (registers.length === 0) {
      const cwd = await readCwd($)

      registers = cwd === '' ? [] : await findRegisters($, cwd, settings)
    }

    const found = await readWaitingDecisions($, registers, snapshots, failingSince)

    await writeDecisions($, found.rows)
    await writeLogNotice($, found.logNotice)
    await followWaiting($, settings)
  } finally {
    isReading = false
  }
}
