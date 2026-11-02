/**
 * The settings the toolbar owns: VS Code shows them under "Claude Toolbar" in its Settings. The two of the context
 * size say how often it is read again and how much of the transcript's end is read. The four of the bands are what the
 * bridge file carries to the chat-colors mod (bridge\bridge-writer.ts); the Chat colors pane sets their colors. The
 * chat-view button writes Claude's own setting, and the pane also writes VS Code's `workbench.colorCustomizations`. A
 * button that needs a setting of its own declares it here; `npm run manifest` writes it into package.json.
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

/** The color of the band above each of the user's prompts. */
export const promptBandColor: OwnedSetting<string> = {
  key: 'claudeToolbar.promptBandColor',
  default: '',
  description: 'Band above each of your prompts, drawn by the chat-colors mod: its color as #RRGGBB. Empty: no band.',
  scope: 'application',
};

/** The color of the band above each of Claude's notes. */
export const notesBandColor: OwnedSetting<string> = {
  key: 'claudeToolbar.notesBandColor',
  default: '',
  description: "Band above each of Claude's notes, drawn by the chat-colors mod: its color as #RRGGBB. Empty: no band.",
  scope: 'application',
};

/** The color of the band above each of Claude's answers. */
export const answerBandColor: OwnedSetting<string> = {
  key: 'claudeToolbar.answerBandColor',
  default: '',
  description: "Band above each of Claude's answers, drawn by the chat-colors mod: its color as #RRGGBB. Empty: no band.",
  scope: 'application',
};

/**
 * How strongly a band's background shows its color. The default is the one a missing tint reads as in
 * chat-colors\hooks\bridge-reading.ts: change them together.
 */
export const bandTintPercent: OwnedSetting<number> = {
  key: 'claudeToolbar.bandTintPercent',
  default: 15,
  description: "How strongly the background of the chat-colors mod's bands shows their color: a whole number from 0 to 100.",
  scope: 'application',
};

/** Every owned setting, in the order VS Code's Settings lists them. */
export const ownedSettings: readonly OwnedSetting[] = [
  contextRefreshMs,
  contextTailBytes,
  promptBandColor,
  notesBandColor,
  answerBandColor,
  bandTintPercent,
];
