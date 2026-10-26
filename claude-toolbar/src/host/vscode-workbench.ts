/**
 * Every id the toolbar takes from VS Code itself, in one place: the setting that overrides the theme's colors, the
 * command that hides the bottom panel, the command VS Code makes for each view, and the name of the CSS variable that
 * gives a webview a theme color. Checked against VS Code 1.141.0's own code (its workbench.desktop.main.js), read on
 * 2026-10-24.
 */

/** The ids, grouped by what they name in VS Code. */
export const vscodeWorkbench = {
  /**
   * The user setting that overrides colors of the color theme: an object of theme color ids, such as
   * `{"descriptionForeground": "#4FA3E0"}`, beside blocks for one theme only, such as `{"[Monokai]": {...}}`.
   * Relied on by: panes\chat-colors\chat-colors-logic.ts (reads it and changes one key of it).
   */
  colorCustomizationsSetting: 'workbench.colorCustomizations',

  /**
   * "Hide Panel": hides the bottom panel. It disposes nothing in it, so a terminal there keeps running.
   * Relied on by: actions\toggle-pane.ts (the manifest puts every pane in the bottom panel).
   */
  closePanelCommand: 'workbench.action.closePanel',
} as const;

/**
 * Names the command VS Code makes for every view ("Focus on <name> View"): it shows the view, opening its panel or
 * side bar, and focuses it. Relied on by: actions\toggle-pane.ts.
 * @param viewId the view's id
 * @returns `<viewId>.focus`
 */
export function focusViewCommand(viewId: string): string {
  return `${viewId}.focus`;
}

/**
 * Names the CSS variable in which VS Code gives every webview a theme color's current value (VS Code's webview
 * guide: `editor.foreground` becomes `--vscode-editor-foreground`). Relied on by: panes\chat-colors\chat-colors-html.ts.
 * @param colorId the theme color's id, such as `inlineChatInput.border`
 * @returns `--vscode-` and the id with `-` for each `.`, such as `--vscode-inlineChatInput-border`
 */
export function themeColorVariable(colorId: string): string {
  return `--vscode-${colorId.replaceAll('.', '-')}`;
}
