/**
 * The chat-colors mod's hooks module, named in hooks/hooks.json: reads the options and registers the hooks.
 */
import type { Register } from 'claude-code'

import { registerRowBands } from './row-bands'
import { registerSessionStart } from './session-start'
import { settingsFrom } from './settings'
import { registerTurnTracking } from './turn-tracking'

/**
 * Registers the session's start (the bridge poll and the history), the turn tracking, and the two message render
 * hooks.
 *
 * @param on the module's registrar
 * @param options the values of the manifest's userConfig fields, defaults filled in
 * @returns nothing; the engine drops what register returns
 */
export const register: Register = (on, options) => {
  const settings = settingsFrom(options)

  registerSessionStart(on, settings)
  registerTurnTracking(on)
  registerRowBands(on, settings)
}
