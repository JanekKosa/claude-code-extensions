/**
 * The two parts of the Claude chat whose color the Chat colors pane sets, in the order its switch shows them, each
 * with the VS Code theme color the chat draws it in (host\claude-extension.ts).
 */

import { claudeExtension } from '../../host/claude-extension';
import type { ChatPart } from '../../media/chat-colors-protocol';

/** One part of the chat, as the pane shows it. */
export interface ChatPartDefinition {
  /** The part, as the page's messages name it. */
  readonly part: ChatPart;
  /** Its name on the switch. */
  readonly label: string;
  /** The theme color the chat draws it in, such as `descriptionForeground`. */
  readonly colorId: string;
}

/** The parts, in the switch's order. */
export const chatParts: readonly ChatPartDefinition[] = [
  { part: 'promptOutline', label: 'Prompt outline', colorId: claudeExtension.themeColors.promptOutline.colorId },
  { part: 'thinkingLines', label: 'Thinking lines', colorId: claudeExtension.themeColors.thinkingLines.colorId },
];

/**
 * Finds a part by its name, as a message from the page names it.
 * @param value what the message holds, of any type
 * @returns the part's definition, or undefined when the value names no part
 */
export function partNamed(value: unknown): ChatPartDefinition | undefined {
  return chatParts.find((definition) => definition.part === value);
}
