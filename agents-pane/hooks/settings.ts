/**
 * The mod's options (`userConfig` in .claude-plugin/plugin.json) as the hooks use them.
 */
import type { PluginOptions } from 'claude-code'

/**
 * The options, read: whether the pane opens by itself, the redraw interval, the roster's size, the label's length,
 * the blank lines between independent agents and between an agent's own rows, and how far a nested agent is indented.
 */
export type Settings = {
  readonly autoOpen: boolean
  readonly tickMs: number
  readonly maxAgents: number
  readonly labelChars: number
  readonly rowGap: number
  readonly childRowGap: number
  readonly indentCells: number
}

/**
 * Reads the options `register` receives.
 *
 * The engine checks each value against its declared type and fills in the defaults before the module loads, so each
 * value already has its declared type.
 *
 * @param options the values of the manifest's userConfig fields
 * @returns the settings the hooks use
 */
export function settingsFrom(options: PluginOptions): Settings {
  return {
    autoOpen: options.autoOpen === true,
    tickMs: Number(options.tickMs),
    maxAgents: Number(options.maxAgents),
    labelChars: Number(options.labelChars),
    rowGap: Number(options.rowGap),
    childRowGap: Number(options.childRowGap),
    indentCells: Number(options.indentCells),
  }
}
