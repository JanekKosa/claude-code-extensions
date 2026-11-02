/**
 * Tests activate with the fake 'vscode': every command package.json declares registered and the Chat colors pane's
 * provider under the view id package.json declares (and the context size followed, which with no folder open does
 * nothing), a click on the chat-view button writing only Claude's Focus view
 * setting at Global, a click VS Code refuses shown as one error, a click on the palette button showing the pane while
 * it is hidden and hiding the panel while it shows, a color saved in the pane merged into the user's
 * workbench.colorCustomizations at Global, keeping what else it held, and a band color saved in the pane reaching the
 * bridge file. The home folder is a temporary one, so the real bridge file is never touched.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activate } from '../src/extension';
import { commands, ConfigurationTarget, fakeVscode, Uri } from './fakes/vscode';
import { packageJsonPath } from './helpers/paths';

const focusView = 'claudeCode.focusView';
const customizations = 'workbench.colorCustomizations';
const promptBand = 'claudeToolbar.promptBandColor';

/** The part of package.json these tests read. */
const manifest = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
  contributes: { commands: { command: string }[]; views: Record<string, { id: string }[]> };
};

/** The command ids package.json declares. */
const declaredIds = manifest.contributes.commands.map((command) => command.command);

/** The view ids package.json declares. */
const declaredViews = Object.values(manifest.contributes.views).flatMap((views) => views.map((view) => view.id));

describe('activate', () => {
  let context: Parameters<typeof activate>[0];
  let home: string;
  let bridgeFile: string;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'claude-toolbar-home-'));
    bridgeFile = join(home, '.claude', 'claude-code-extensions', 'chat-view.json');
    vi.stubEnv('USERPROFILE', home);
    vi.stubEnv('HOME', home);
    if (homedir() !== home) throw new Error(`The home folder is still ${homedir()}: a test must never write the real bridge file.`);
    fakeVscode.reset();
    context = { subscriptions: [], extensionUri: Uri.file('C:\\extensions\\claude-toolbar') };
  });

  afterEach(async () => {
    await vi.waitFor(() => expect(existsSync(bridgeFile)).toBe(true));
    for (const subscription of context.subscriptions) subscription.dispose();
    vi.unstubAllEnvs();
    rmSync(home, { recursive: true, force: true, maxRetries: 5 });
  });

  it('registers every command and every pane package.json declares, and keeps one disposable for each, one for the context size and one for the bridge file', () => {
    activate(context);
    expect([[...fakeVscode.commands.keys()].sort(), [...fakeVscode.viewProviders.keys()]]).toEqual([[...declaredIds].sort(), declaredViews]);
    expect(context.subscriptions).toHaveLength(declaredIds.length + declaredViews.length + 2);
  });

  it('writes the bridge file under the home folder when it starts, with no band while no color is set', async () => {
    fakeVscode.settings.set('claudeToolbar.bandTintPercent', 15);
    activate(context);
    await vi.waitFor(() => expect(readFileSync(bridgeFile, 'utf8')).toBe('{"colors":{"prompt":null,"notes":null,"answer":null},"tintPercent":15}\n'));
  });

  it('carries a band color saved in the pane to the bridge file', async () => {
    fakeVscode.settings.set('claudeToolbar.bandTintPercent', 15);
    activate(context);
    fakeVscode.buildView('claudeToolbar.chatColors').receive({ type: 'save', part: 'promptBand', color: '#123abc' });
    await vi.waitFor(() => expect(readFileSync(bridgeFile, 'utf8')).toBe('{"colors":{"prompt":"#123ABC","notes":null,"answer":null},"tintPercent":15}\n'));
    expect(fakeVscode.updates).toStrictEqual([{ key: promptBand, value: '#123ABC', target: ConfigurationTarget.Global }]);
  });

  it("writes only Claude's Focus view setting at Global on a click of the chat-view button", async () => {
    activate(context);
    await commands.executeCommand('claudeToolbar.chatView.everything');
    await commands.executeCommand('claudeToolbar.chatView.focusView');
    expect(fakeVscode.updates).toStrictEqual([
      { key: focusView, value: true, target: ConfigurationTarget.Global },
      { key: focusView, value: false, target: ConfigurationTarget.Global },
    ]);
  });

  it('shows one error when VS Code refuses the settings of a click', async () => {
    activate(context);
    fakeVscode.updateFailure = 'Unable to write to User Settings because claudeCode.focusView is not a registered configuration.';
    await commands.executeCommand('claudeToolbar.chatView.everything');
    expect(fakeVscode.errorMessages).toEqual([
      'Clicking "Chat shows everything. Click for Focus view (Claude\'s work folded)." failed: Unable to write to User Settings because claudeCode.focusView is not a registered configuration.',
    ]);
  });

  it('shows the Chat colors pane on a click of the palette button while it is hidden, and hides the panel while it shows', async () => {
    activate(context);
    await commands.executeCommand('claudeToolbar.chatColors');
    const view = fakeVscode.buildView('claudeToolbar.chatColors');
    await commands.executeCommand('claudeToolbar.chatColors');
    view.visible = false;
    await commands.executeCommand('claudeToolbar.chatColors');
    expect(fakeVscode.commandRuns.map((run) => run.commandId)).toEqual([
      'claudeToolbar.chatColors',
      'claudeToolbar.chatColors.focus',
      'claudeToolbar.chatColors',
      'workbench.action.closePanel',
      'claudeToolbar.chatColors',
      'claudeToolbar.chatColors.focus',
    ]);
  });

  it("builds the pane's page, and merges a color saved there into the user's colorCustomizations at Global", async () => {
    fakeVscode.settings.set(customizations, { 'editor.background': '#1E1E1E', '[Monokai]': { descriptionForeground: '#FF0000' } });
    activate(context);
    const view = fakeVscode.buildView('claudeToolbar.chatColors');
    view.receive({ type: 'save', part: 'thinkingLines', color: '#123abc' });
    for (let turn = 0; turn < 4; turn++) await nextTurn();
    expect([view.html.includes('iro.min.js'), fakeVscode.updates]).toStrictEqual([
      true,
      [
        {
          key: customizations,
          value: { 'editor.background': '#1E1E1E', '[Monokai]': { descriptionForeground: '#FF0000' }, descriptionForeground: '#123ABC' },
          target: ConfigurationTarget.Global,
        },
      ],
    ]);
  });
});
