/**
 * Tests the context display: each size read sets the context key through VS Code's setContext, in thousands; the
 * refresh time and the bytes read come from the owned settings, or their defaults when unset; and with no folder open
 * nothing is watched or set.
 */

import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startContextDisplay } from '../../src/session/context-display';
import { FakeToolbarHost } from '../helpers/fake-toolbar-host';
import { FakeTranscriptFiles } from '../helpers/fake-transcript-files';

const projects = join('C:\\Users\\me', '.claude', 'projects');
const agentFolder = join(projects, 'c--Repos-agent');

/**
 * Writes a transcript's text holding one assistant record of a size.
 * @param tokens the size, all as input tokens
 * @returns the text
 */
function withSize(tokens: number): string {
  return JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: tokens } } });
}

describe('startContextDisplay', () => {
  let files: FakeTranscriptFiles;

  beforeEach(() => {
    vi.useFakeTimers();
    files = new FakeTranscriptFiles();
    files.addFolder(projects, ['c--Repos-agent']);
    files.addFolder(agentFolder);
    files.writeTranscript(join(agentFolder, 'chat.jsonl'), 100, withSize(212_400));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets the key to the size in thousands, reading the default number of bytes when the setting is unset", () => {
    const host = new FakeToolbarHost();
    host.folderPaths.push('c:\\Repos\\agent');
    const display = startContextDisplay(host, files, projects);
    display.dispose();
    expect([host.commands, files.tailReads.map((read) => read.bytes)]).toEqual([
      [{ commandId: 'setContext', args: ['claudeToolbar.contextK', 212] }],
      [4_194_304],
    ]);
  });

  it('waits the refresh time and reads the bytes the user set', () => {
    const host = new FakeToolbarHost({ settings: { 'claudeToolbar.contextRefreshMs': 250, 'claudeToolbar.contextTailBytes': 1024 } });
    host.folderPaths.push('c:\\Repos\\agent');
    const display = startContextDisplay(host, files, projects);
    files.writeTranscript(join(agentFolder, 'chat.jsonl'), 101, withSize(0));
    files.change(agentFolder);
    vi.advanceTimersByTime(250);
    display.dispose();
    expect([host.commands.map((command) => command.args[1]), files.tailReads.map((read) => read.bytes)]).toEqual([
      [212, 0],
      [1024, 1024],
    ]);
  });

  it('watches and sets nothing when no folder is open', () => {
    const host = new FakeToolbarHost();
    startContextDisplay(host, files, projects).dispose();
    expect([host.commands, files.watchedFolders()]).toEqual([[], []]);
  });
});
