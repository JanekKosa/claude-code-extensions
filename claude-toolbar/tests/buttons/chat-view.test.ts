/**
 * Tests the chat-view button: its two decided looks, the derivation of the current view from Claude's Focus view
 * setting (Focus view while it is on, else everything), and that a click writes that one setting, and only it, at
 * the Global level.
 */

import { describe, expect, it } from 'vitest';
import { chatViewButton, chatViewTable } from '../../src/buttons/chat-view';
import { FakeButtonHost } from '../helpers/fake-button-host';
import { describeViewTable } from '../helpers/view-table-suite';

const focusView = 'claudeCode.focusView';

describe('the chat-view button', () => {
  it('shows the decided icon and tooltip for each of its two views', () => {
    expect(chatViewButton.looks.map(({ id, icon, tooltip }) => ({ id, icon, tooltip }))).toStrictEqual([
      { id: 'focusView', icon: 'comment', tooltip: "Chat in Focus view (Claude's work folded). Click to show everything." },
      { id: 'everything', icon: 'eye', tooltip: "Chat shows everything. Click for Focus view (Claude's work folded)." },
    ]);
  });

  it('writes claudeCode.focusView and no other setting on a click of either look', async () => {
    const written: string[][] = [];
    for (const look of chatViewButton.looks) {
      const host = new FakeButtonHost();
      await look.onClick(host);
      written.push(host.writes.flatMap((write) => Object.keys(write.values)));
    }
    expect(written).toEqual([[focusView], [focusView]]);
  });
});

describeViewTable({
  name: 'the chat view',
  table: chatViewTable,
  button: chatViewButton,
  derivation: [
    { settings: { [focusView]: false }, view: 'everything' },
    { settings: { [focusView]: true }, view: 'focusView' },
  ],
  clicks: [
    { look: 'everything', next: 'focusView', writes: { [focusView]: true } },
    { look: 'focusView', next: 'everything', writes: { [focusView]: false } },
  ],
});
