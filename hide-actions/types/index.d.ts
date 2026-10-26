/**
 * The hide-actions mod's contract: the one `$.state` value it owns.
 *
 * `hideActions` is true while the bridge file says `{"hideActions": true}`. The bridge poll writes it; the tool-row
 * render hooks read it, so a change redraws those rows at once.
 */

/** Whether tool rows are hidden now. */
export type HideActions = boolean

declare module 'claude-code' {
  interface PluginState {
    'hide-actions': { hideActions: HideActions }
  }
}
