/**
 * The tool-row render hooks (ToolUse, ToolResult, ToolGroup). While `hideActions` is true, a row on a listed
 * surface is drawn as an empty Box, which Claude's VS Code chat drops; every other row is the engine's own drawing.
 */
import type { On, RenderElement, StateDollar } from 'claude-code'

import { readHideActions } from './hide-state'
import type { Settings } from './settings'

/** A tool row as the decision sees it: where it is drawn, whether it is drawn in full, and the tools it names. */
type Row = {
  readonly surface: string
  readonly isExpanded: boolean | undefined
  readonly tools: readonly string[]
}

// ── Registering ──

/**
 * Registers one render hook per tool-row site; a grouped row names every tool in its group.
 *
 * @param on the module's registrar
 * @param settings the mod's options (surfaces, alwaysShow)
 * @returns nothing
 */
export function registerRowHooks(on: On, settings: Settings): void {
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) =>
    (await isHidden($, settings, { surface: e.surface, isExpanded: e.props.isExpanded, tools: [e.props.tool] }))
      ? hiddenRow()
      : next(e),
  )
  on('ui.render', { component: 'ToolResult' }, async ($, e, next) =>
    (await isHidden($, settings, { surface: e.surface, isExpanded: e.props.isExpanded, tools: [e.props.tool] }))
      ? hiddenRow()
      : next(e),
  )
  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) =>
    (await isHidden($, settings, {
      surface: e.surface,
      isExpanded: e.props.isExpanded,
      tools: e.props.calls.map(call => call.tool),
    }))
      ? hiddenRow()
      : next(e),
  )
}

// ── Deciding ──

/**
 * Whether a row hides now. The value is read only for a row that may hide, so the read subscribes exactly the rows
 * a change of the value redraws.
 *
 * @param $ the engine interface (its state)
 * @param settings the mod's options
 * @param row the row being drawn
 * @returns true when the row is to be drawn empty
 */
async function isHidden($: StateDollar, settings: Settings, row: Row): Promise<boolean> {
  return !isAlwaysDrawn(settings, row) && (await readHideActions($))
}

/**
 * Whether a row is the engine's own drawing whatever the bridge says: on a surface not listed, drawn in full (the
 * ctrl+o transcript, verbose), or naming a tool that always shows.
 *
 * @param settings the mod's options
 * @param row the row being drawn
 * @returns true when the row is drawn as usual
 */
function isAlwaysDrawn(settings: Settings, row: Row): boolean {
  return (
    !settings.surfaces.includes(row.surface) ||
    row.isExpanded === true ||
    row.tools.some(tool => settings.alwaysShow.includes(tool))
  )
}

// ── Drawing ──

/**
 * The tree a hidden row is drawn as: an empty Box with no child, no border and no background. The chat's tool row
 * draws nothing for a tree that holds no engine node and nothing visible. `props` and `children` are written out
 * because the chat's visibility check reads both.
 *
 * @returns a fresh empty Box
 */
function hiddenRow(): RenderElement {
  return { type: 'Box', props: {}, children: [] }
}
