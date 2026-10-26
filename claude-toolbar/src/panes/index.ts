/**
 * The toolbar's panes, in the order their tabs appear in the bottom panel. Add a new pane as its own folder in this
 * folder and append it here; `npm run manifest` then declares its view in package.json, and activate registers it.
 */

import type { PaneDefinition } from '../host/pane';
import { chatColorsPane } from './chat-colors/chat-colors-pane';

/** The panes, in panel order. Append new ones. */
export const toolbarPanes: readonly PaneDefinition[] = [chatColorsPane];
