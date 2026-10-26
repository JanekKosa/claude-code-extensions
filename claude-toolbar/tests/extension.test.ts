/**
 * Tests activate with the fake 'vscode': every command package.json declares registered and the Chat colors pane's
 * provider under the view id package.json declares (and the context size followed, which with no folder open does
 * nothing), a click on the chat-view button writing only Claude's Focus view
 * setting at Global, a click VS Code refuses shown as one error, a click on the palette button showing the pane while
 * it is hidden and hiding the panel while it shows, and a color saved in the pane merged into the user's
 * workbench.colorCustomizations at Global, keeping what else it held.
 */

import { readFileSync } from 'node:fs';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { activate } from '../src/extension';
import { commands, ConfigurationTarget, fakeVscode, Uri } from './fakes/vscode';
import { packageJsonPath } from './helpers/paths';

const focusView = 'claudeCode.focusView';
const customizations = 'workbench.colorCustomizations';

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

  beforeEach(() => {
    fakeVscode.reset();
    context = { subscriptions: [], extensionUri: Uri.file('C:\\extensions\\claude-toolbar') };
  });

  afterEach(() => {
    for (const subscription of context.subscriptions) subscription.dispose();
  });

  it('registers every command and every pane package.json declares, and keeps one disposable for each and one for the context size', () => {
    activate(context);
    expect([[...fakeVscode.commands.keys()].sort(), [...fakeVscode.viewProviders.keys()]]).toEqual([[...declaredIds].sort(), declaredViews]);
    expect(context.subscriptions).toHaveLength(declaredIds.length + declaredViews.length + 1);
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
