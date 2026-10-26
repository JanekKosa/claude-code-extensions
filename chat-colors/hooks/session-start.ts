/**
 * The mod's one session.start hook (the engine takes one per event and module): it starts the bridge poll before
 * the session starts, and classifies the transcript a resumed chat holds once it has started.
 */
import type { On } from 'claude-code'

import { startPolling } from './bridge-poll'
import { classifyHistory } from './history'
import type { Settings } from './settings'

// ── Registering ──

/**
 * Registers the session.start hook.
 *
 * @param on the module's registrar
 * @param settings the mod's options (pollMs)
 * @returns nothing
 */
export function registerSessionStart(on: On, settings: Settings): void {
  on('session.start', async ($, e, next) => {
    await startPolling($, settings.pollMs)
    const started = await next(e)

    await classifyHistory($)

    return started
  })
}
