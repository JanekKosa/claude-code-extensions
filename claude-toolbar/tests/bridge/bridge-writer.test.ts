/**
 * Tests the bridge writer with the fake toolbar host, in a temporary folder: the file's path, the exact text of the
 * contract, what is left out as no band, a write at start and on a change of a band setting and of no other setting,
 * two quick changes ending on the last, one error for a failed write, and stopping.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bridgeFilePath } from '../../src/bridge/bridge-path';
import { startBridgeWriter } from '../../src/bridge/bridge-writer';
import { FakeToolbarHost } from '../helpers/fake-toolbar-host';

const prompt = 'claudeToolbar.promptBandColor';
const notes = 'claudeToolbar.notesBandColor';
const answer = 'claudeToolbar.answerBandColor';
const tint = 'claudeToolbar.bandTintPercent';

/** The band settings the file's text in chat-colors\README.md comes from. */
const contractSettings = { [prompt]: '#4FA3E0', [notes]: '#D29922', [answer]: '#3FB950', [tint]: 15 };

/** The text chat-colors\tests\hooks\bridge-reading.test.ts reads: change them together. */
const contractText = '{"colors":{"prompt":"#4FA3E0","notes":"#D29922","answer":"#3FB950"},"tintPercent":15}\n';

describe('the bridge file path', () => {
  it('is the file the mods read, under the home folder', () => {
    expect(bridgeFilePath('C:\\Users\\someone')).toBe(join('C:\\Users\\someone', '.claude', 'claude-code-extensions', 'chat-view.json'));
  });
});

describe('the bridge writer', () => {
  let folder: string;
  let file: string;

  /**
   * Waits until the file holds a text.
   * @param text the text
   * @returns when it does
   */
  async function fileHolds(text: string): Promise<void> {
    await vi.waitFor(() => expect(readFileSync(file, 'utf8')).toBe(text));
  }

  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), 'claude-toolbar-bridge-'));
    file = bridgeFilePath(folder);
  });

  afterEach(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  it('writes the exact text of the contract when it starts, into a folder it creates', async () => {
    startBridgeWriter(new FakeToolbarHost({ settings: contractSettings }), file).dispose();
    await fileHolds(contractText);
  });

  it('writes no band for an empty, short or named color', async () => {
    const settings = { [prompt]: '', [notes]: '#abc', [answer]: 'red', [tint]: 40 };
    startBridgeWriter(new FakeToolbarHost({ settings }), file).dispose();
    await fileHolds('{"colors":{"prompt":null,"notes":null,"answer":null},"tintPercent":40}\n');
  });

  it('brings a color to upper case', async () => {
    startBridgeWriter(new FakeToolbarHost({ settings: { ...contractSettings, [prompt]: '#a1b2c3' } }), file).dispose();
    await fileHolds(contractText.replace('#4FA3E0', '#A1B2C3'));
  });

  it.each([prompt, notes, answer, tint])('writes again when %s changes', async (key) => {
    const host = new FakeToolbarHost({ settings: contractSettings });
    startBridgeWriter(host, file);
    await fileHolds(contractText);
    host.changeSettings({ [key]: key === tint ? 50 : '#000000' });
    await vi.waitFor(() => expect(readFileSync(file, 'utf8')).not.toBe(contractText));
  });

  it('watches the four band settings and no other', () => {
    const host = new FakeToolbarHost({ settings: contractSettings });
    startBridgeWriter(host, file);
    expect(host.watches.map((watch) => watch.keys)).toEqual([[prompt, notes, answer, tint]]);
  });

  it('ends on the last of two quick changes', async () => {
    const host = new FakeToolbarHost({ settings: contractSettings });
    startBridgeWriter(host, file);
    host.changeSettings({ [prompt]: '#111111' });
    host.changeSettings({ [prompt]: '#222222' });
    await fileHolds(contractText.replace('#4FA3E0', '#222222'));
  });

  it('shows one error when the file cannot be written', async () => {
    const blocker = join(folder, 'a file');
    writeFileSync(blocker, '');
    const inFile = bridgeFilePath(blocker);
    const host = new FakeToolbarHost({ settings: contractSettings });
    startBridgeWriter(host, inFile);
    await vi.waitFor(() => expect(host.errors).toHaveLength(1));
    expect(host.errors[0]).toContain(`Claude Toolbar could not write the chat colors to ${inFile}: `);
  });

  it('stops following the settings when disposed', async () => {
    const host = new FakeToolbarHost({ settings: contractSettings });
    startBridgeWriter(host, file).dispose();
    await fileHolds(contractText);
    expect(host.watches.map((watch) => watch.disposed)).toEqual([true]);
  });
});
