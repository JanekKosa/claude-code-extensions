/**
 * The hide-actions mod's hooks module, named in hooks/hooks.json: reads the options and registers the hooks.
 */
import type { Register } from 'claude-code'

import { registerBridgePoll } from './bridge-poll'
import { registerRowHooks } from './row-visibility'
import { settingsFrom } from './settings'

/**
 * Registers the bridge poll (on session.start) and the three tool-row render hooks.
 *
 * @param on the module's registrar
 * @param options the values of the manifest's userConfig fields, defaults filled in
 * @returns nothing; the engine drops what register returns
 */
export const register: Register = (on, options) => {
  const settings = settingsFrom(options)

  registerBridgePoll(on, settings)
  registerRowHooks(on, settings)
}
