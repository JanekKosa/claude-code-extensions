/**
 * The mod's options (`userConfig` in .claude-plugin/plugin.json) as the hooks use them.
 */
import type { PluginOptions } from 'claude-code'

import { splitList } from '../utils/text-list'

/** The options, read: the poll interval, the surfaces that get coloured bands, and the bands' height. */
export type Settings = {
  readonly pollMs: number
  readonly surfaces: readonly string[]
  readonly bandRows: number
}

/**
 * Reads the options `register` receives.
 *
 * The engine checks each value against its declared type and fills in the defaults before the module loads, so
 * `pollMs` and `bandRows` are numbers and `surfaces` is comma-separated text.
 *
 * @param options the values of the manifest's userConfig fields
 * @returns the settings the hooks use
 */
export function settingsFrom(options: PluginOptions): Settings {
  return {
    pollMs: Number(options.pollMs),
    surfaces: splitList(String(options.surfaces)),
    bandRows: Number(options.bandRows),
  }
}
