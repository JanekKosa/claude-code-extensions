/**
 * The agents-pane mod's hooks module, named in hooks/hooks.json: reads the options and registers the hooks.
 */
import type { Register } from 'claude-code'

import { registerAgentTracking } from './agent-tracking'
import { registerPane } from './pane'
import { settingsFrom } from './settings'

/**
 * Registers the agent tracking (starts, steps, turn ends, /clear) and the pane (its command, timer, close mark and
 * drawing).
 *
 * @param on the module's registrar
 * @param options the values of the manifest's userConfig fields, defaults filled in
 * @returns nothing; the engine drops what register returns
 */
export const register: Register = (on, options) => {
  const settings = settingsFrom(options)

  registerAgentTracking(on, settings)
  registerPane(on, settings)
}
