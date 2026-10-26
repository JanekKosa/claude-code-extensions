/**
 * Tests the palette button: its one decided look, shown wherever the toolbar shows, and that a click shows the Chat
 * colors pane while it is hidden and hides the panel while it shows, writing no setting either way; and the pane it
 * toggles.
 */

import { describe, expect, it } from 'vitest';
import { chatColorsButton } from '../../src/buttons/chat-colors';
import { chatColorsPane } from '../../src/panes/chat-colors/chat-colors-pane';
import { always } from '../../src/utils/when-clause';
import { FakeButtonHost } from '../helpers/fake-button-host';

describe('the palette button', () => {
  it('has one look: the symbol-color icon, the decided tooltip, always shown', () => {
    expect(chatColorsButton.id).toBe('chatColors');
    expect(chatColorsButton.looks.map(({ id, icon, tooltip, when }) => ({ id, icon, tooltip, when }))).toStrictEqual([
      { id: 'toggle', icon: 'symbol-color', tooltip: 'Chat colors: show or hide the pane that colors the prompt outline and the thinking lines.', when: always },
    ]);
  });

  it('shows the Chat colors pane on a click while it is hidden, and hides the panel while it shows', async () => {
    const hidden = new FakeButtonHost();
    const shown = new FakeButtonHost();
    shown.visiblePanes.add('claudeToolbar.chatColors');
    for (const host of [hidden, shown]) await chatColorsButton.looks[0].onClick(host);
    expect([hidden.commands, shown.commands, hidden.writes, shown.writes]).toStrictEqual([
      [{ commandId: 'claudeToolbar.chatColors.focus', args: [] }],
      [{ commandId: 'workbench.action.closePanel', args: [] }],
      [],
      [],
    ]);
  });

  it('toggles the pane titled "Chat colors", with the palette icon', () => {
    expect([chatColorsPane.id, chatColorsPane.title, chatColorsPane.icon]).toEqual(['chatColors', 'Chat colors', 'symbol-color']);
  });
});
