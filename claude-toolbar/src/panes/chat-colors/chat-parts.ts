/**
 * The parts of the Claude chat whose color the Chat colors pane sets, in the order its switch shows them. Two the chat
 * draws in a VS Code theme color (host\claude-extension.ts), saved in `workbench.colorCustomizations`; three are the
 * bands of the chat-colors mod, saved in the toolbar's own settings, which the bridge file carries to the mod.
 */

import { claudeExtension } from '../../host/claude-extension';
import type { ChatPart } from '../../media/chat-colors-protocol';
import { answerBandColor, notesBandColor, promptBandColor } from '../../settings/owned-settings';
import type { OwnedSetting } from '../../toolbar/contracts';

/** One part of the chat, as the pane shows it. */
export interface ChatPartDefinition {
  /** The part, as the page's messages name it. */
  readonly part: ChatPart;
  /** Its name on the switch. */
  readonly label: string;
  /** What its button says while the user has set no color. */
  readonly unsetText: string;
  /** The theme color the page shows while the user has set no color, such as `descriptionForeground`. */
  readonly colorId: string;
  /** The setting that holds a band's color. Left out for a part drawn in its theme color. */
  readonly setting?: OwnedSetting<string>;
}

/** What a band's button says, and the theme color the wheel starts from, while it has no color. */
const noBand = { unsetText: 'no band', colorId: 'foreground' } as const;

/** What a part drawn in a theme color says while the user has set no color. */
const themeDefaultText = 'theme default';

/** The parts, in the switch's order. */
export const chatParts: readonly ChatPartDefinition[] = [
  { part: 'promptOutline', label: 'Prompt outline', unsetText: themeDefaultText, colorId: claudeExtension.themeColors.promptOutline.colorId },
  { part: 'thinkingLines', label: 'Thinking lines', unsetText: themeDefaultText, colorId: claudeExtension.themeColors.thinkingLines.colorId },
  { part: 'promptBand', label: 'Prompt band', ...noBand, setting: promptBandColor },
  { part: 'notesBand', label: 'Notes band', ...noBand, setting: notesBandColor },
  { part: 'answerBand', label: 'Answer band', ...noBand, setting: answerBandColor },
];

/**
 * Finds a part by its name, as a message from the page names it.
 * @param value what the message holds, of any type
 * @returns the part's definition, or undefined when the value names no part
 */
export function partNamed(value: unknown): ChatPartDefinition | undefined {
  return chatParts.find((definition) => definition.part === value);
}
