/**
 * The toolbar's buttons, in the order they show from left to right. Add a new button as its own file in this
 * folder and append it here; `npm run manifest` then writes its menu entries into package.json.
 */

import type { ToolbarButton } from '../toolbar/contracts';
import { chatColorsButton } from './chat-colors';
import { chatViewButton } from './chat-view';
import { contextSizeButton } from './context-size';

/** The buttons, in toolbar order. Append new ones. The context size stays first, left of every button. */
export const toolbarButtons: readonly ToolbarButton[] = [contextSizeButton, chatViewButton, chatColorsButton];
