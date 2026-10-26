/**
 * The Chat colors pane: a tab titled "Chat colors" in VS Code's bottom panel, where the user sets two colors of the
 * Claude chat, its prompt box's outline and its thinking lines, as VS Code theme colors. Its page is
 * chat-colors-html.ts, its logic chat-colors-logic.ts.
 */

import type { PaneDefinition } from '../../host/pane';
import { chatColorsHtml, chatColorsTitle } from './chat-colors-html';
import { connectChatColors } from './chat-colors-logic';

/** The pane. */
export const chatColorsPane: PaneDefinition = {
  id: 'chatColors',
  title: chatColorsTitle,
  icon: 'symbol-color',
  html: chatColorsHtml,
  connect: connectChatColors,
};
