/**
 * Opening and closing the Agents pane: on the person's command, and by itself when an agent starts unless the person
 * closed it.
 */
import type { EngineInterface, UiOpenResult } from 'claude-code'

import { isDismissed, writeDismissed } from './roster-state'

/** What the pane's control uses of the engine interface. */
export type PaneDollar = Pick<EngineInterface, 'ui' | 'state'>

/** The pane's id, which its render hook matches on. */
export const PANE_ID = 'agents-pane'

/** The pane's title, shown on its tab while another pane is open too. */
const PANE_TITLE = 'Agents'

// ── Reading ──

/**
 * Tells whether the pane is open, shown or waiting for room.
 *
 * @param $ the engine interface
 * @returns true while the engine holds it open
 */
export async function isPaneOpen($: PaneDollar): Promise<boolean> {
  return (await $.ui.panes()).some(pane => pane.id === PANE_ID)
}

// ── Opening and closing ──

/**
 * Opens the pane at the person's word: it is theirs to close again, and opens by itself from then on.
 *
 * @param $ the engine interface
 * @returns whether the surface placed it, and why not
 */
export async function openPaneForPerson($: PaneDollar): Promise<UiOpenResult> {
  await writeDismissed($, false)

  return $.ui.open({ id: PANE_ID, title: PANE_TITLE })
}

/**
 * Opens the pane by itself, unless it is open already or the person closed it.
 *
 * @param $ the engine interface
 * @returns once opened, or at once when it is not to be
 */
export async function openPaneUnlessDismissed($: PaneDollar): Promise<void> {
  if ((await isDismissed($)) || (await isPaneOpen($))) {
    return
  }

  await $.ui.open({ id: PANE_ID, title: PANE_TITLE })
}

/**
 * Closes the pane at the person's word.
 *
 * @param $ the engine interface
 * @returns once closed
 */
export async function closePaneForPerson($: PaneDollar): Promise<void> {
  await writeDismissed($, true)
  await $.ui.close({ id: PANE_ID })
}
