/**
 * The invariant: the menu when-clauses exactly as package.json holds them show, in each Claude chat, exactly one
 * look of the chat-view button (the look of the derived view), the palette button and the context size (0k while its
 * key is unset), with the context size first, and no toolbar button anywhere else. Both values of Claude's Focus view setting in 5 contexts: Claude's side bar view, its secondary side bar view
 * and its chat tab, and two that are not Claude's (the Explorer, a Markdown preview tab). The built expressions are
 * evaluated; the two buttons' rendering is pinned to exact strings, and package.json is proved equal to the
 * rendering of every button.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chatColorsButton } from '../../src/buttons/chat-colors';
import { chatViewButton, chatViewTable } from '../../src/buttons/chat-view';
import { contextSizeButton } from '../../src/buttons/context-size';
import { claudeExtension } from '../../src/host/claude-extension';
import { commandId } from '../../src/toolbar/identity';
import { buildMenuEntries, type Contributes } from '../../src/toolbar/manifest';
import { deriveView } from '../../src/toolbar/view-cycle';
import { renderWhen } from '../../src/utils/when-clause';
import { toolbarDefinition } from '../../scripts/toolbar-definition';
import { FakeButtonHost } from '../helpers/fake-button-host';
import { combinations, contexts } from '../helpers/menu-contexts';
import { packageJsonPath } from '../helpers/paths';
import { evaluateWhen } from '../helpers/when-clause-eval';

/** The menus of the real package.json. */
const menus = (JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { contributes: Contributes }).contributes.menus;

/** Every menu entry, its condition still an expression. */
const entries = buildMenuEntries(toolbarDefinition.buttons, toolbarDefinition.places);

/** The commands of the chat-view button's looks. */
const chatViewCommands = new Set(chatViewButton.looks.map((look) => commandId(chatViewButton, look)));

/** The palette button's one command. */
const chatColorsCommand = commandId(chatColorsButton, chatColorsButton.looks[0]);

/** The commands of the context size's looks. */
const contextSizeCommands = new Set(contextSizeButton.looks.map((look) => commandId(contextSizeButton, look)));

describe('the menu when-clauses in package.json', () => {
  it('are the rendering of the built expressions', () => {
    for (const place of toolbarDefinition.places) {
      const built = entries.filter((entry) => entry.menuId === place.menuId);
      expect(menus[place.menuId]).toStrictEqual(built.map((entry) => ({ command: entry.command, when: renderWhen(entry.when), group: entry.group })));
    }
  });

  it('are exactly these strings for the chat-view button and the palette button', () => {
    const sidebars = "view == 'claudeVSCodeSidebar' || view == 'claudeVSCodeSidebarSecondary'";
    const tab = "activeWebviewPanelId == 'claudeVSCodePanel'";
    const buttonEntries = entries.filter((entry) => !contextSizeCommands.has(entry.command));
    expect(buttonEntries.map((entry) => [entry.menuId, entry.command, renderWhen(entry.when), entry.group])).toEqual([
      ['view/title', 'claudeToolbar.chatView.focusView', `(${sidebars}) && config.claudeCode.focusView`, 'navigation@2'],
      ['view/title', 'claudeToolbar.chatView.everything', `(${sidebars}) && !config.claudeCode.focusView`, 'navigation@2'],
      ['view/title', 'claudeToolbar.chatColors', sidebars, 'navigation@3'],
      ['editor/title', 'claudeToolbar.chatView.focusView', `${tab} && config.claudeCode.focusView`, 'navigation@2'],
      ['editor/title', 'claudeToolbar.chatView.everything', `${tab} && !config.claudeCode.focusView`, 'navigation@2'],
      ['editor/title', 'claudeToolbar.chatColors', tab, 'navigation@3'],
    ]);
  });

  it('put every look of the context size first, at navigation@1, in both places', () => {
    const sizeEntries = entries.filter((entry) => contextSizeCommands.has(entry.command));
    expect([sizeEntries.length, new Set(sizeEntries.map((entry) => entry.group))]).toEqual([2 * contextSizeButton.looks.length, new Set(['navigation@1'])]);
  });
});

describe('what each menu shows', () => {
  for (const context of contexts) {
    for (const { focusView } of combinations) {
      it(`${context.name}, focusView ${focusView}`, () => {
        const settings = { [claudeExtension.booleanSettings.focusView]: focusView };
        const values = { ...context.keys, ...Object.fromEntries(Object.entries(settings).map(([key, value]) => [`config.${key}`, value])) };
        const shown = entries.filter((entry) => entry.menuId === context.menuId && evaluateWhen(entry.when, values)).map((entry) => entry.command);
        const derived = chatViewButton.looks.find((look) => look.id === deriveView(chatViewTable, new FakeButtonHost(settings)).id)!;
        expect(shown.filter((command) => chatViewCommands.has(command)), 'the chat-view button').toEqual(
          context.claude ? [commandId(chatViewButton, derived)] : [],
        );
        expect(shown.filter((command) => command === chatColorsCommand), 'the palette button').toEqual(context.claude ? [chatColorsCommand] : []);
        expect(shown.filter((command) => contextSizeCommands.has(command)), 'the context size, its key unset').toEqual(
          context.claude ? ['claudeToolbar.contextSize.k0'] : [],
        );
        expect(context.claude ? [] : shown, 'no toolbar button shows outside the Claude chats').toEqual([]);
      });
    }
  }
});
