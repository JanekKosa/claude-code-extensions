/**
 * Every id the toolbar takes from Claude Code's VS Code extension (anthropic.claude-code), in one place. Claude's
 * extension can rename any of them in an update; tests\host\claude-extension.integration.test.ts checks each one
 * against the newest installed copy (`npm run test:integration`). Checked against 2.1.306.
 */

/** The ids, grouped by what they name in Claude's extension. */
export const claudeExtension = {
  /** Side bar views that hold a Claude chat (its `contributes.views`). */
  views: {
    /**
     * The chat view in Claude's side bar container, used when the editor has no secondary side bar.
     * Relied on by: toolbar\places.ts (the `view/title` place).
     */
    sidebar: 'claudeVSCodeSidebar',
    /**
     * The chat view in Claude's secondary side bar container.
     * Relied on by: toolbar\places.ts (the `view/title` place).
     */
    secondarySidebar: 'claudeVSCodeSidebarSecondary',
  },

  /** View types of the webview panels Claude opens as editor tabs (found in its `extension.js`). */
  panelViewTypes: {
    /**
     * A Claude chat opened as an editor tab. Claude's own when-clauses test it with `activeWebviewPanelId`.
     * Relied on by: toolbar\places.ts (the `editor/title` place).
     */
    chat: 'claudeVSCodePanel',
  },

  /** Boolean settings Claude declares (its `contributes.configuration`). */
  booleanSettings: {
    /**
     * Claude's Focus view: folds each stretch of Claude's work into one line. Claude's extension pushes every
     * change of it to the open chats, and its own Ctrl+Alt+F writes it at the user (Global) level.
     * Relied on by: buttons\chat-view.ts (it selects the Focus view look, and a click writes it).
     */
    focusView: 'claudeCode.focusView',
  },

  /**
   * VS Code theme colors that Claude's chat draws parts of itself in (its `webview\index.css`), each with the
   * chat's own CSS variable that reads it. Changing the color in `workbench.colorCustomizations` changes that part.
   * Relied on by: panes\chat-colors\chat-parts.ts (the parts the Chat colors pane sets).
   */
  themeColors: {
    /** The outline of the prompt box: `--app-input-border` takes `--vscode-inlineChatInput-border` first. */
    promptOutline: { colorId: 'inlineChatInput.border', chatVariable: '--app-input-border' },
    /** The thinking lines ("Thought for 4s", a thinking's text): `--app-secondary-foreground`. */
    thinkingLines: { colorId: 'descriptionForeground', chatVariable: '--app-secondary-foreground' },
  },
} as const;
