/**
 * The settings the toolbar owns: VS Code shows them under "Claude Toolbar" in its Settings. The two of the context
 * size say how often it is read again and how much of the transcript's end is read. The chat-view button writes
 * Claude's own setting, and the Chat colors pane writes VS Code's `workbench.colorCustomizations`. A button that needs
 * a setting of its own declares it here; `npm run manifest` writes it into package.json.
 */

import type { OwnedSetting } from '../toolbar/contracts';

/** How long the context size waits after a change of the transcript before it reads it again. */
export const contextRefreshMs: OwnedSetting<number> = {
  key: 'claudeToolbar.contextRefreshMs',
  default: 1000,
  description: 'Context size: how long to wait after Claude writes to the chat before reading its size again, in milliseconds.',
  scope: 'application',
};

/** How much of the transcript's end the context size reads to find the latest size. */
export const contextTailBytes: OwnedSetting<number> = {
  key: 'claudeToolbar.contextTailBytes',
  default: 4_194_304,
  description:
    "Context size: how many bytes of the end of the chat's transcript are read to find its latest size. Raise it if the size shows 0k while Claude answers with very long tool results.",
  scope: 'application',
};

/** Every owned setting, in the order VS Code's Settings lists them. */
export const ownedSettings: readonly OwnedSetting[] = [contextRefreshMs, contextTailBytes];
