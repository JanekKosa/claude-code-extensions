/**
 * Tests the logic behind the Chat colors page with a fake page and the fake toolbar host: the state sent when the page
 * is ready (theme default while nothing is set), a color saved from the wheel or typed merged into the user's
 * workbench.colorCustomizations at Global under the part's theme color, a text that is not a color rejected and
 * reported, Default removing only the part's color, nothing written when nothing changes, a refused write or a setting
 * that holds no object shown as one error, two quick saves both kept, a change made elsewhere sent at once, messages
 * the page cannot have sent ignored, and disconnecting.
 */

import { setImmediate as nextTurn } from 'node:timers/promises';
import { beforeEach, describe, expect, it } from 'vitest';
import type { PanePage } from '../../../src/host/pane';
import type { Disposable } from '../../../src/host/toolbar-host';
import type { StateMessage } from '../../../src/media/chat-colors-protocol';
import { connectChatColors } from '../../../src/panes/chat-colors/chat-colors-logic';
import { FakeToolbarHost } from '../../helpers/fake-toolbar-host';

const setting = 'workbench.colorCustomizations';
const outline = 'inlineChatInput.border';
const thinking = 'descriptionForeground';

/** A page for tests: what the logic posts is recorded, and a test sends what the page's script would. */
class FakePage implements PanePage {
  /** Every message posted to the page, in order. */
  readonly posted: StateMessage[] = [];

  /** The live listeners. */
  readonly listeners = new Set<(message: unknown) => void>();

  /**
   * Records a message.
   * @param message the message
   */
  post(message: unknown): void {
    this.posted.push(message as StateMessage);
  }

  /**
   * Adds a listener.
   * @param listener the listener
   * @returns what removes it
   */
  onMessage(listener: (message: unknown) => void): Disposable {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  }

  /**
   * Sends messages as the page's script would, all at once, and waits until the logic has answered them.
   * @param messages the messages
   * @returns when the logic is done with them
   */
  async send(...messages: unknown[]): Promise<void> {
    for (const message of messages) for (const listener of [...this.listeners]) listener(message);
    for (let turn = 0; turn < 4 * messages.length; turn++) await nextTurn();
  }
}

/**
 * The state the page would show.
 * @param promptOutline the prompt outline's color, null for theme default
 * @param thinkingLines the thinking lines' color, null for theme default
 * @returns the state message, without a rejection
 */
function state(promptOutline: string | null, thinkingLines: string | null): StateMessage {
  return {
    type: 'state',
    parts: [
      { part: 'promptOutline', color: promptOutline },
      { part: 'thinkingLines', color: thinkingLines },
    ],
  };
}

/** The user's colorCustomizations of the tests that keep other keys: another color and a block for one theme. */
const others = { 'editor.background': '#1E1E1E', '[Monokai]': { [thinking]: '#FF0000' } };

describe('the Chat colors logic', () => {
  let host: FakeToolbarHost;
  let page: FakePage;

  beforeEach(() => {
    host = new FakeToolbarHost();
    page = new FakePage();
  });

  it('sends the state when the page is ready: theme default for both parts while nothing is set, and writes nothing', async () => {
    connectChatColors(page, host);
    await page.send({ type: 'ready' });
    expect([page.posted, host.writes]).toStrictEqual([[state(null, null)], []]);
  });

  it("sends each part's color as the user's settings hold it at the top level, not a theme block's", async () => {
    host = new FakeToolbarHost({ settings: { [setting]: { ...others, [outline]: '#abc' } } });
    connectChatColors(page, host);
    await page.send({ type: 'ready' });
    expect(page.posted).toStrictEqual([state('#abc', null)]);
  });

  it('merges a color saved from the wheel into the setting at Global, in upper case, under the part\'s theme color', async () => {
    host = new FakeToolbarHost({ settings: { [setting]: others } });
    connectChatColors(page, host);
    await page.send({ type: 'save', part: 'thinkingLines', color: '#a1b2c3' });
    expect([host.writes, page.posted]).toStrictEqual([[{ values: { [setting]: { ...others, [thinking]: '#A1B2C3' } }, target: 'global' }], [state(null, '#A1B2C3')]]);
  });

  it('saves the prompt outline as inlineChatInput.border, a typed color with spaces around it and no #', async () => {
    connectChatColors(page, host);
    await page.send({ type: 'save', part: 'promptOutline', color: '  a1b2c3 ' });
    expect(host.writes).toStrictEqual([{ values: { [setting]: { [outline]: '#A1B2C3' } }, target: 'global' }]);
  });

  it.each(['blue', '#12345', '#1234567', '#abc', ''])('writes nothing for the typed text "%s", and reports it in the state', async (text) => {
    connectChatColors(page, host);
    await page.send({ type: 'save', part: 'promptOutline', color: text });
    expect([host.writes, page.posted]).toStrictEqual([[], [{ ...state(null, null), rejected: { part: 'promptOutline', text } }]]);
  });

  it("removes only the part's color on Default, keeping every other key and theme block", async () => {
    host = new FakeToolbarHost({ settings: { [setting]: { ...others, [outline]: '#111111', [thinking]: '#222222' } } });
    connectChatColors(page, host);
    await page.send({ type: 'useDefault', part: 'thinkingLines' });
    expect([host.writes, page.posted]).toStrictEqual([[{ values: { [setting]: { ...others, [outline]: '#111111' } }, target: 'global' }], [state('#111111', null)]]);
  });

  it('removes the setting entirely when Default leaves nothing in it', async () => {
    host = new FakeToolbarHost({ settings: { [setting]: { [outline]: '#111111' } } });
    connectChatColors(page, host);
    await page.send({ type: 'useDefault', part: 'promptOutline' });
    expect(host.writes).toStrictEqual([{ values: { [setting]: undefined }, target: 'global' }]);
  });

  it('writes nothing when nothing changes: the same color again, or Default for a part without a color', async () => {
    host = new FakeToolbarHost({ settings: { [setting]: { [outline]: '#111111' } } });
    connectChatColors(page, host);
    await page.send({ type: 'save', part: 'promptOutline', color: '#111111' }, { type: 'useDefault', part: 'thinkingLines' });
    expect([host.writes, page.posted]).toStrictEqual([[], [state('#111111', null), state('#111111', null)]]);
  });

  it('keeps both of two quick saves: each reads the setting after the one before has been written', async () => {
    const write = host.writeSettings.bind(host);
    host.writeSettings = async (values, target) => {
      await nextTurn();
      await write(values, target);
    };
    connectChatColors(page, host);
    await page.send({ type: 'save', part: 'promptOutline', color: '#111111' }, { type: 'save', part: 'thinkingLines', color: '#222222' });
    expect(host.readUserSetting(setting)).toStrictEqual({ [outline]: '#111111', [thinking]: '#222222' });
  });

  it('shows one error naming the part when VS Code refuses the write, and still answers with the state', async () => {
    host.writeSettings = async () => {
      throw new Error('Unable to write to User Settings.');
    };
    connectChatColors(page, host);
    await page.send({ type: 'save', part: 'thinkingLines', color: '#222222' });
    expect([host.errors, page.posted]).toStrictEqual([['Claude Toolbar could not save the thinking lines color: Unable to write to User Settings.'], [state(null, null)]]);
  });

  it('writes nothing and shows one error when the setting holds no object', async () => {
    host = new FakeToolbarHost({ settings: { [setting]: 'blue' } });
    connectChatColors(page, host);
    await page.send({ type: 'save', part: 'promptOutline', color: '#111111' });
    expect([host.writes, host.errors]).toStrictEqual([
      [],
      ['Claude Toolbar could not save the prompt outline color: workbench.colorCustomizations in your user settings is not an object, so it was left as it is.'],
    ]);
  });

  it('sends the state when the setting changes elsewhere, and not for another setting', () => {
    connectChatColors(page, host);
    host.changeSettings({ 'editor.fontSize': 15 });
    host.changeSettings({ [setting]: { [thinking]: '#333333' } });
    expect(page.posted).toStrictEqual([state(null, '#333333')]);
  });

  it.each([
    ['another type', { type: 'paint', part: 'promptOutline' }],
    ['an unknown part', { type: 'save', part: 'answer', color: '#123456' }],
    ['no part', { type: 'useDefault' }],
    ['a color that is not text', { type: 'save', part: 'promptOutline', color: 123456 }],
    ['text', 'ready'],
    ['null', null],
  ])('ignores a message with %s: no write, no answer', async (_name, message) => {
    connectChatColors(page, host);
    await page.send(message);
    expect([host.writes, page.posted]).toStrictEqual([[], []]);
  });

  it('stops listening to the page and watching the setting when disconnected', async () => {
    connectChatColors(page, host).dispose();
    await page.send({ type: 'ready' });
    host.changeSettings({ [setting]: {} });
    expect([page.listeners.size, host.watches.map((watch) => watch.disposed), page.posted]).toStrictEqual([0, [true], []]);
  });
});
