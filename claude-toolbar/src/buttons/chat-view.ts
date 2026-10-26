/**
 * The chat-view button: switches Claude's Focus view on and off. One ordered table holds the two views; the current
 * view, the condition that shows each look and what a click writes all come from it (toolbar\view-cycle.ts).
 *
 * The rows are in derivation order, first match wins: Focus view if Claude's Focus view setting is on, else
 * everything. A click enters the other view by writing that one setting, and only it, at the user (Global) level.
 */

import { claudeExtension } from '../host/claude-extension';
import { type ViewRow, viewCycleButton } from '../toolbar/view-cycle';

/** Claude's Focus view setting. */
const focusView = claudeExtension.booleanSettings.focusView;

/** The chat's views, in derivation order. */
export const chatViewTable: readonly ViewRow[] = [
  {
    id: 'focusView',
    icon: 'comment',
    tooltip: "Chat in Focus view (Claude's work folded). Click to show everything.",
    selectedBy: focusView,
    writes: { [focusView]: true },
    next: 'everything',
  },
  {
    id: 'everything',
    icon: 'eye',
    tooltip: "Chat shows everything. Click for Focus view (Claude's work folded).",
    writes: { [focusView]: false },
    next: 'focusView',
  },
];

/** The chat-view button. */
export const chatViewButton = viewCycleButton('chatView', chatViewTable);
