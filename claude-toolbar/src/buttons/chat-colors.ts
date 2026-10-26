/**
 * The palette button: shows the Chat colors pane in the bottom panel, or hides the panel while the pane shows. One
 * look, shown wherever the toolbar shows.
 */

import { togglePane } from '../actions/toggle-pane';
import { chatColorsPane } from '../panes/chat-colors/chat-colors-pane';
import type { ToolbarButton } from '../toolbar/contracts';
import { always } from '../utils/when-clause';

/** The palette button. */
export const chatColorsButton: ToolbarButton = {
  id: 'chatColors',
  looks: [
    {
      id: 'toggle',
      icon: 'symbol-color',
      tooltip: 'Chat colors: show or hide the pane that colors the prompt outline and the thinking lines.',
      when: always,
      onClick: togglePane(chatColorsPane),
    },
  ],
};
